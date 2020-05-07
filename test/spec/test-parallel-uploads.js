const { TestHttpStack, waitableFunction, wait, getBlob } = require("./helpers/utils");
const tus = require("../../");

describe("tus", function () {
  describe("parallel uploading", function () {
    it("should throw if incompatible options are used", function () {
      var file = getBlob("hello world");
      var upload = new tus.Upload(file, {
        endpoint: "https://tus.io/uploads",
        parallelUploads: 2,
        uploadUrl: "foo"
      });
      expect(upload.start.bind(upload)).toThrowError("tus: cannot use the uploadUrl option when parallelUploads is enabled");
    });

    it("should split a file into multiple parts and create an upload for each", async function () {
      const testStack = new TestHttpStack();

      const testUrlStorage = {
        addUpload: (fingerprint, upload) => {
          expect(fingerprint).toBe("fingerprinted");
          expect(upload.uploadUrl).toBeUndefined();
          expect(upload.size).toBe(11);
          expect(upload.parallelUploadUrls).toEqual([
            "https://tus.io/uploads/upload1",
            "https://tus.io/uploads/upload2"
          ]);

          return Promise.resolve("tus::fingerprinted::1337");
        },
        removeUpload: (urlStorageKey) => {
          expect(urlStorageKey).toBe("tus::fingerprinted::1337");
          return Promise.resolve();
        }
      };
      spyOn(testUrlStorage, "removeUpload").and.callThrough();
      spyOn(testUrlStorage, "addUpload").and.callThrough();

      const file = getBlob("hello world");
      const options = {
        httpStack: testStack,
        urlStorage: testUrlStorage,
        storeFingerprintForResuming: true,
        removeFingerprintOnSuccess: true,
        parallelUploads: 2,
        retryDelays: [ 10 ],
        endpoint: "https://tus.io/uploads",
        headers: {
          Custom: "blargh"
        },
        metadata: {
          foo: "hello"
        },
        onProgress: function () {},
        onSuccess: waitableFunction(),
        fingerprint: () => Promise.resolve("fingerprinted")
      };
      spyOn(options, "onProgress");

      const upload = new tus.Upload(file, options);
      upload.start();

      let req = await testStack.nextRequest();
      expect(req.url).toBe("https://tus.io/uploads");
      expect(req.method).toBe("POST");
      expect(req.requestHeaders.Custom).toBe("blargh");
      expect(req.requestHeaders["Tus-Resumable"]).toBe("1.0.0");
      expect(req.requestHeaders["Upload-Length"]).toBe(5);
      expect(req.requestHeaders["Upload-Concat"]).toBe("partial");
      expect(req.requestHeaders["Upload-Metadata"]).toBeUndefined();

      req.respondWith({
        status: 201,
        responseHeaders: {
          Location: "https://tus.io/uploads/upload1"
        }
      });

      req = await testStack.nextRequest();
      expect(req.url).toBe("https://tus.io/uploads");
      expect(req.method).toBe("POST");
      expect(req.requestHeaders.Custom).toBe("blargh");
      expect(req.requestHeaders["Tus-Resumable"]).toBe("1.0.0");
      expect(req.requestHeaders["Upload-Length"]).toBe(6);
      expect(req.requestHeaders["Upload-Concat"]).toBe("partial");
      expect(req.requestHeaders["Upload-Metadata"]).toBeUndefined();

      req.respondWith({
        status: 201,
        responseHeaders: {
          Location: "https://tus.io/uploads/upload2"
        }
      });

      req = await testStack.nextRequest();

      // Assert that the URLs have been stored.
      expect(testUrlStorage.addUpload).toHaveBeenCalled();

      expect(req.url).toBe("https://tus.io/uploads/upload1");
      expect(req.method).toBe("PATCH");
      expect(req.requestHeaders.Custom).toBe("blargh");
      expect(req.requestHeaders["Tus-Resumable"]).toBe("1.0.0");
      expect(req.requestHeaders["Upload-Offset"]).toBe(0);
      expect(req.requestHeaders["Content-Type"]).toBe("application/offset+octet-stream");
      expect(req.body.size).toBe(5);

      req.respondWith({
        status: 204,
        responseHeaders: {
          "Upload-Offset": 5
        }
      });


      req = await testStack.nextRequest();
      expect(req.url).toBe("https://tus.io/uploads/upload2");
      expect(req.method).toBe("PATCH");
      expect(req.requestHeaders.Custom).toBe("blargh");
      expect(req.requestHeaders["Tus-Resumable"]).toBe("1.0.0");
      expect(req.requestHeaders["Upload-Offset"]).toBe(0);
      expect(req.requestHeaders["Content-Type"]).toBe("application/offset+octet-stream");
      expect(req.body.size).toBe(6);

      // Return an error to ensure that the individual partial upload is properly retried.
      req.respondWith({
        status: 500
      });

      req = await testStack.nextRequest();
      expect(req.url).toBe("https://tus.io/uploads/upload2");
      expect(req.method).toBe("HEAD");

      req.respondWith({
        status: 204,
        responseHeaders: {
          "Upload-Length": 11,
          "Upload-Offset": 0
        }
      });

      req = await testStack.nextRequest();
      expect(req.url).toBe("https://tus.io/uploads/upload2");
      expect(req.method).toBe("PATCH");
      expect(req.requestHeaders.Custom).toBe("blargh");
      expect(req.requestHeaders["Tus-Resumable"]).toBe("1.0.0");
      expect(req.requestHeaders["Upload-Offset"]).toBe(0);
      expect(req.requestHeaders["Content-Type"]).toBe("application/offset+octet-stream");
      expect(req.body.size).toBe(6);

      req.respondWith({
        status: 204,
        responseHeaders: {
          "Upload-Offset": 6
        }
      });

      req = await testStack.nextRequest();
      expect(req.url).toBe("https://tus.io/uploads");
      expect(req.method).toBe("POST");
      expect(req.requestHeaders.Custom).toBe("blargh");
      expect(req.requestHeaders["Tus-Resumable"]).toBe("1.0.0");
      expect(req.requestHeaders["Upload-Length"]).toBeUndefined();
      expect(req.requestHeaders["Upload-Concat"]).toBe("final;https://tus.io/uploads/upload1 https://tus.io/uploads/upload2");
      expect(req.requestHeaders["Upload-Metadata"]).toBe("foo aGVsbG8=");

      req.respondWith({
        status: 201,
        responseHeaders: {
          "Location": "https://tus.io/uploads/upload3"
        }
      });

      await options.onSuccess.toBeCalled;

      expect(upload.url).toBe("https://tus.io/uploads/upload3");
      expect(options.onProgress).toHaveBeenCalledWith(5, 11);
      expect(options.onProgress).toHaveBeenCalledWith(11, 11);
      expect(testUrlStorage.removeUpload).toHaveBeenCalled();
    });

    it("should emit error from a partial upload", async function () {
      const testStack = new TestHttpStack();
      const file = getBlob("hello world");
      const options = {
        httpStack: testStack,
        parallelUploads: 2,
        retryDelays: null,
        endpoint: "https://tus.io/uploads",
        onError: waitableFunction("onError")
      };

      const upload = new tus.Upload(file, options);
      upload.start();

      let req = await testStack.nextRequest();
      expect(req.url).toBe("https://tus.io/uploads");
      expect(req.method).toBe("POST");
      expect(req.requestHeaders["Tus-Resumable"]).toBe("1.0.0");
      expect(req.requestHeaders["Upload-Length"]).toBe(5);

      req.respondWith({
        status: 500
      });

      const err = await options.onError.toBeCalled;
      expect(err.message).toBe("tus: unexpected response while creating upload, originated from request (method: POST, url: https://tus.io/uploads, response code: 500, response text: , request id: n/a)");
      expect(err.originalRequest).toBe(req);
    });

    it("should resume the partial uploads", async function () {
      const testStack = new TestHttpStack();
      const file = getBlob("hello world");
      const options = {
        httpStack: testStack,
        // The client should resume the parallel uploads, even if it is not
        // configured for new uploads.
        parallelUploads: 1,
        endpoint: "https://tus.io/uploads",
        onProgress: function () {},
        onSuccess: waitableFunction()
      };
      spyOn(options, "onProgress");

      const upload = new tus.Upload(file, options);

      upload.resumeFromPreviousUpload({
        urlStorageKey: "tus::fingerprint::1337",
        parallelUploadUrls: [
          "https://tus.io/uploads/upload1",
          "https://tus.io/uploads/upload2"
        ]
      });

      upload.start();

      let req = await testStack.nextRequest();
      expect(req.url).toBe("https://tus.io/uploads/upload1");
      expect(req.method).toBe("HEAD");

      req.respondWith({
        status: 204,
        responseHeaders: {
          "Upload-Length": 5,
          "Upload-Offset": 2
        }
      });

      req = await testStack.nextRequest();
      expect(req.url).toBe("https://tus.io/uploads/upload2");
      expect(req.method).toBe("HEAD");

      req.respondWith({
        status: 204,
        responseHeaders: {
          "Upload-Length": 6,
          "Upload-Offset": 0
        }
      });

      req = await testStack.nextRequest();
      expect(req.url).toBe("https://tus.io/uploads/upload1");
      expect(req.method).toBe("PATCH");
      expect(req.body.size).toBe(3);

      req.respondWith({
        status: 204,
        responseHeaders: {
          "Upload-Offset": 5
        }
      });

      req = await testStack.nextRequest();
      expect(req.url).toBe("https://tus.io/uploads/upload2");
      expect(req.method).toBe("PATCH");
      expect(req.body.size).toBe(6);

      req.respondWith({
        status: 204,
        responseHeaders: {
          "Upload-Offset": 6
        }
      });

      req = await testStack.nextRequest();
      expect(req.url).toBe("https://tus.io/uploads");
      expect(req.method).toBe("POST");
      expect(req.requestHeaders["Upload-Concat"]).toBe("final;https://tus.io/uploads/upload1 https://tus.io/uploads/upload2");

      req.respondWith({
        status: 201,
        responseHeaders: {
          "Location": "https://tus.io/uploads/upload3"
        }
      });

      await options.onSuccess.toBeCalled;

      expect(upload.url).toBe("https://tus.io/uploads/upload3");
      expect(options.onProgress).toHaveBeenCalledWith(5, 11);
      expect(options.onProgress).toHaveBeenCalledWith(11, 11);
    });

    it("should abort all partial uploads and resume from them", async function () {
      const testStack = new TestHttpStack();
      const file = getBlob("hello world");
      const options = {
        httpStack: testStack,
        parallelUploads: 2,
        endpoint: "https://tus.io/uploads",
        onProgress: function () {},
        onSuccess: waitableFunction(),
        fingerprint: () => Promise.resolve("fingerprinted")
      };
      spyOn(options, "onProgress");

      const upload = new tus.Upload(file, options);
      upload.start();

      let req = await testStack.nextRequest();
      expect(req.url).toBe("https://tus.io/uploads");
      expect(req.method).toBe("POST");
      expect(req.requestHeaders["Tus-Resumable"]).toBe("1.0.0");
      expect(req.requestHeaders["Upload-Length"]).toBe(5);
      expect(req.requestHeaders["Upload-Concat"]).toBe("partial");
      expect(req.requestHeaders["Upload-Metadata"]).toBeUndefined();

      req.respondWith({
        status: 201,
        responseHeaders: {
          Location: "https://tus.io/uploads/upload1"
        }
      });

      req = await testStack.nextRequest();
      expect(req.url).toBe("https://tus.io/uploads");
      expect(req.method).toBe("POST");
      expect(req.requestHeaders["Tus-Resumable"]).toBe("1.0.0");
      expect(req.requestHeaders["Upload-Length"]).toBe(6);
      expect(req.requestHeaders["Upload-Concat"]).toBe("partial");
      expect(req.requestHeaders["Upload-Metadata"]).toBeUndefined();

      req.respondWith({
        status: 201,
        responseHeaders: {
          Location: "https://tus.io/uploads/upload2"
        }
      });

      const req1 = await testStack.nextRequest();
      expect(req1.url).toBe("https://tus.io/uploads/upload1");
      expect(req1.method).toBe("PATCH");
      expect(req1.requestHeaders["Tus-Resumable"]).toBe("1.0.0");
      expect(req1.requestHeaders["Upload-Offset"]).toBe(0);
      expect(req1.requestHeaders["Content-Type"]).toBe("application/offset+octet-stream");
      expect(req1.body.size).toBe(5);

      const req2 = await testStack.nextRequest();
      expect(req2.url).toBe("https://tus.io/uploads/upload2");
      expect(req2.method).toBe("PATCH");
      expect(req2.requestHeaders["Tus-Resumable"]).toBe("1.0.0");
      expect(req2.requestHeaders["Upload-Offset"]).toBe(0);
      expect(req2.requestHeaders["Content-Type"]).toBe("application/offset+octet-stream");
      expect(req2.body.size).toBe(6);

      upload.abort();

      req1.respondWith({
        status: 204,
        responseHeaders: {
          "Upload-Offset": 5
        }
      });

      req2.respondWith({
        status: 204,
        responseHeaders: {
          "Upload-Offset": 6
        }
      });

      // No further requests should be sent.
      const reqPromise = testStack.nextRequest();
      const result = await Promise.race([
        reqPromise,
        wait(100)
      ]);
      expect(result).toBe("timed out");

      // Restart the upload
      upload.start();

      // Reuse the promise from before as it is not cancelled.
      req = await reqPromise;
      expect(req.url).toBe("https://tus.io/uploads/upload1");
      expect(req.method).toBe("HEAD");

      req.respondWith({
        status: 204,
        responseHeaders: {
          "Upload-Length": 5,
          "Upload-Offset": 5
        }
      });

      req = await testStack.nextRequest();
      expect(req.url).toBe("https://tus.io/uploads/upload2");
      expect(req.method).toBe("HEAD");

      req.respondWith({
        status: 204,
        responseHeaders: {
          "Upload-Length": 6,
          "Upload-Offset": 6
        }
      });

      req = await testStack.nextRequest();
      expect(req.url).toBe("https://tus.io/uploads");
      expect(req.method).toBe("POST");
      expect(req.requestHeaders["Tus-Resumable"]).toBe("1.0.0");
      expect(req.requestHeaders["Upload-Length"]).toBeUndefined();
      expect(req.requestHeaders["Upload-Concat"]).toBe("final;https://tus.io/uploads/upload1 https://tus.io/uploads/upload2");

      req.respondWith({
        status: 201,
        responseHeaders: {
          "Location": "https://tus.io/uploads/upload3"
        }
      });

      await options.onSuccess.toBeCalled;

      expect(upload.url).toBe("https://tus.io/uploads/upload3");
      expect(options.onProgress).toHaveBeenCalledWith(5, 11);
      expect(options.onProgress).toHaveBeenCalledWith(11, 11);
    });
  });
});