/* global Blob  */

const assertUrlStorage = require("./helpers/assertUrlStorage");
const { TestHttpStack, waitableFunction, wait } = require("./helpers/utils");
const tus = require("../../");

describe("tus", function () {
  beforeEach(function () {
    localStorage.clear();
  });

  describe("#Upload", function () {
    it("should resume an upload from a stored url", async function () {
      localStorage.setItem("tus::fingerprinted::1337", JSON.stringify({
        uploadUrl: "http://tus.io/uploads/resuming"
      }));

      const testStack = new TestHttpStack();
      var file = new Blob("hello world".split(""));
      var options = {
        httpStack: testStack,
        endpoint: "http://tus.io/uploads",
        onProgress: function () {},
        fingerprint: function () {}
      };
      spyOn(options, "fingerprint").and.resolveTo("fingerprinted");
      spyOn(options, "onProgress");

      var upload = new tus.Upload(file, options);

      const previousUploads = await upload.findPreviousUploads();
      expect(previousUploads).toEqual([{
        uploadUrl: "http://tus.io/uploads/resuming",
        urlStorageKey: "tus::fingerprinted::1337"
      }]);
      upload.resumeFromPreviousUpload(previousUploads[0]);

      upload.start();

      expect(options.fingerprint).toHaveBeenCalledWith(file, upload.options);

      var req = await testStack.nextRequest();
      expect(req.url).toBe("http://tus.io/uploads/resuming");
      expect(req.method).toBe("HEAD");
      expect(req.requestHeaders["Tus-Resumable"]).toBe("1.0.0");

      req.respondWith({
        status: 204,
        responseHeaders: {
          "Upload-Length": 11,
          "Upload-Offset": 3
        }
      });

      req = await testStack.nextRequest();
      expect(req.url).toBe("http://tus.io/uploads/resuming");
      expect(req.method).toBe("PATCH");
      expect(req.requestHeaders["Tus-Resumable"]).toBe("1.0.0");
      expect(req.requestHeaders["Upload-Offset"]).toBe(3);
      expect(req.requestHeaders["Content-Type"]).toBe("application/offset+octet-stream");
      expect(req.body.size).toBe(11 - 3);

      req.respondWith({
        status: 204,
        responseHeaders: {
          "Upload-Offset": 11
        }
      });

      expect(upload.url).toBe("http://tus.io/uploads/resuming");
      expect(options.onProgress).toHaveBeenCalledWith(11, 11);
    });

    describe("storing of upload urls", function () {
      const testStack = new TestHttpStack();
      var options = {
        httpStack: testStack,
        endpoint: "http://tus.io/uploads",
        fingerprint: function () {}
      };

      var startUpload = async function () {
        var file = new Blob("hello world".split(""));
        spyOn(options, "fingerprint").and.resolveTo("fingerprinted");
        options.onSuccess = waitableFunction("onSuccess");

        var upload = new tus.Upload(file, options);
        upload.start();

        expect(options.fingerprint).toHaveBeenCalled();

        var req = await testStack.nextRequest();
        expect(req.url).toBe("http://tus.io/uploads");
        expect(req.method).toBe("POST");

        req.respondWith({
          status: 201,
          responseHeaders: {
            Location: "/uploads/blargh"
          }
        });

        // Wait a short delay to allow the Promises to settle
        await wait(10);
      };

      var finishUpload = async function () {
        var req = await testStack.nextRequest();
        expect(req.url).toBe("http://tus.io/uploads/blargh");
        expect(req.method).toBe("PATCH");

        req.respondWith({
          status: 204,
          responseHeaders: {
            "Upload-Offset": 11
          }
        });

        await options.onSuccess.toBeCalled;
      };

      it("should store and retain with default options", async function () {
        options.removeFingerprintOnSuccess = false;
        await startUpload();

        const key = localStorage.key(0);
        expect(key.indexOf("tus::fingerprinted::")).toBe(0);

        const storedUpload = JSON.parse(localStorage.getItem(key));
        expect(storedUpload.uploadUrl).toBe("http://tus.io/uploads/blargh");
        expect(storedUpload.size).toBe(11);

        await finishUpload();

        expect(localStorage.getItem(key)).toBe(JSON.stringify(storedUpload));
      });

      it("should store and remove with option removeFingerprintOnSuccess set", async function () {
        options.removeFingerprintOnSuccess = true;
        await startUpload();

        const key = localStorage.key(0);
        expect(key.indexOf("tus::fingerprinted::")).toBe(0);

        const storedUpload = JSON.parse(localStorage.getItem(key));
        expect(storedUpload.uploadUrl).toBe("http://tus.io/uploads/blargh");
        expect(storedUpload.size).toBe(11);

        await finishUpload();
        expect(localStorage.getItem(key)).toBe(null);
      });
    });

    it("should delete upload urls on a 4XX", async function () {
      const testStack = new TestHttpStack();
      var file = new Blob("hello world".split(""));
      var options = {
        httpStack: testStack,
        endpoint: "http://tus.io/uploads",
        fingerprint: function () {}
      };
      spyOn(options, "fingerprint").and.resolveTo("fingerprinted");

      var upload = new tus.Upload(file, options);

      upload.resumeFromPreviousUpload({
        uploadUrl: "http://tus.io/uploads/resuming",
        urlStorageKey: "tus::fingerprinted::1337"
      });

      upload.start();

      var req = await testStack.nextRequest();
      expect(req.url).toBe("http://tus.io/uploads/resuming");
      expect(req.method).toBe("HEAD");

      req.respondWith({
        status: 400
      });

      await wait(10);

      expect(localStorage.getItem("tus::fingerprinted::1337")).toBe(null);
    });

    describe("uploading data from a Reader", function () {
      function makeReader(content, readSize = content.length) {
        const reader = {
          value: content.split(""),
          read: function () {
            var value, done = false;
            if (this.value.length > 0) {
              value = this.value.slice(0,readSize);
              this.value = this.value.slice(readSize);
            } else {
              done = true;
            }
            return Promise.resolve({ value: value, done: done });
          },
          cancel: waitableFunction("cancel")
        };

        return reader;
      }

      async function assertReaderUpload({ readSize, chunkSize }) {
        var reader = makeReader("hello world", readSize);

        var testStack = new TestHttpStack();
        var options = {
          httpStack: testStack,
          endpoint: "http://tus.io/uploads",
          chunkSize: chunkSize,
          onProgress: waitableFunction("onProgress"),
          onSuccess: waitableFunction("onSuccess"),
          fingerprint: function () {},
          uploadLengthDeferred: true
        };
        spyOn(options, "fingerprint").and.resolveTo("fingerprinted");

        var upload = new tus.Upload(reader, options);
        upload.start();

        expect(options.fingerprint).toHaveBeenCalledWith(reader, upload.options);

        var req = await testStack.nextRequest();
        expect(req.url).toBe("http://tus.io/uploads");
        expect(req.method).toBe("POST");
        expect(req.requestHeaders["Upload-Length"]).toBe(undefined);
        expect(req.requestHeaders["Upload-Defer-Length"]).toBe(1);

        req.respondWith({
          status: 201,
          responseHeaders: {
            Location: "http://tus.io/uploads/blargh"
          }
        });

        req = await testStack.nextRequest();
        expect(req.url).toBe("http://tus.io/uploads/blargh");
        expect(req.method).toBe("PATCH");
        expect(req.requestHeaders["Upload-Offset"]).toBe(0);
        expect(req.requestHeaders["Content-Type"]).toBe("application/offset+octet-stream");
        expect(req.body.length).toBe(11);

        req.respondWith({
          status: 204,
          responseHeaders: {
            "Upload-Offset": 11
          }
        });

        await options.onProgress.toBeCalled;
        expect(options.onProgress).toHaveBeenCalledWith(11, null);

        req = await testStack.nextRequest();
        expect(req.url).toBe("http://tus.io/uploads/blargh");
        expect(req.method).toBe("PATCH");
        expect(req.requestHeaders["Upload-Offset"]).toBe(11);
        expect(req.requestHeaders["Upload-Length"]).toBe(11);
        expect(req.requestHeaders["Content-Type"]).toBe("application/offset+octet-stream");
        expect(req.body).toBe(null);

        req.respondWith({
          status: 204,
          responseHeaders: {
            "Upload-Offset": 11
          }
        });

        await options.onSuccess.toBeCalled;
        expect(upload.url).toBe("http://tus.io/uploads/blargh");
        expect(options.onProgress).toHaveBeenCalledWith(11, 11);
      }

      it("should upload data", async function () {
        await assertReaderUpload({ chunkSize: 100, readSize: 100 });
      });

      it("should read multiple times from the reader", async function () {
        await assertReaderUpload({ chunkSize: 100, readSize: 6 });
      });

      it("should use multiple PATCH requests", async function () {
        var reader = makeReader("hello world", 1);

        var testStack = new TestHttpStack();
        var options = {
          httpStack: testStack,
          endpoint: "http://tus.io/uploads",
          chunkSize: 6,
          onProgress: waitableFunction("onProgress"),
          onSuccess: waitableFunction("onSuccess"),
          fingerprint: function () {},
          uploadLengthDeferred: true
        };
        spyOn(options, "fingerprint").and.resolveTo("fingerprinted");

        var upload = new tus.Upload(reader, options);
        upload.start();

        expect(options.fingerprint).toHaveBeenCalledWith(reader, upload.options);

        var req = await testStack.nextRequest();
        expect(req.url).toBe("http://tus.io/uploads");
        expect(req.method).toBe("POST");
        expect(req.requestHeaders["Upload-Length"]).toBe(undefined);
        expect(req.requestHeaders["Upload-Defer-Length"]).toBe(1);

        req.respondWith({
          status: 201,
          responseHeaders: {
            Location: "http://tus.io/uploads/blargh"
          }
        });

        req = await testStack.nextRequest();
        expect(req.url).toBe("http://tus.io/uploads/blargh");
        expect(req.method).toBe("PATCH");
        expect(req.requestHeaders["Upload-Offset"]).toBe(0);
        expect(req.requestHeaders["Content-Type"]).toBe("application/offset+octet-stream");
        expect(req.body.length).toBe(6);

        req.respondWith({
          status: 204,
          responseHeaders: {
            "Upload-Offset": 6
          }
        });

        await options.onProgress.toBeCalled;
        expect(options.onProgress).toHaveBeenCalledWith(6, null);

        req = await testStack.nextRequest();
        expect(req.url).toBe("http://tus.io/uploads/blargh");
        expect(req.method).toBe("PATCH");
        expect(req.requestHeaders["Tus-Resumable"]).toBe("1.0.0");
        expect(req.requestHeaders["Upload-Offset"]).toBe(6);
        expect(req.requestHeaders["Content-Type"]).toBe("application/offset+octet-stream");
        expect(req.body.length).toBe(5);

        req.respondWith({
          status: 204,
          responseHeaders: {
            "Upload-Offset": 11
          }
        });

        req = await testStack.nextRequest();
        expect(req.url).toBe("http://tus.io/uploads/blargh");
        expect(req.method).toBe("PATCH");
        expect(req.requestHeaders["Upload-Offset"]).toBe(11);
        expect(req.requestHeaders["Upload-Length"]).toBe(11);
        expect(req.requestHeaders["Content-Type"]).toBe("application/offset+octet-stream");
        expect(req.body).toBe(null);

        req.respondWith({
          status: 204,
          responseHeaders: {
            "Upload-Offset": 11
          }
        });

        await options.onSuccess.toBeCalled;
        expect(upload.url).toBe("http://tus.io/uploads/blargh");
        expect(options.onProgress).toHaveBeenCalledWith(11, 11);
      });

      it("should retry the POST request", async function () {
        var reader = makeReader("hello world", 1);

        var testStack = new TestHttpStack();
        var options = {
          httpStack: testStack,
          endpoint: "http://tus.io/files/",
          chunkSize: 11,
          retryDelays: [10, 10, 10],
          onSuccess: waitableFunction("onSuccess"),
          uploadLengthDeferred: true
        };

        var upload = new tus.Upload(reader, options);
        upload.start();

        var req = await testStack.nextRequest();
        expect(req.url).toBe("http://tus.io/files/");
        expect(req.method).toBe("POST");

        req.respondWith({
          status: 500
        });

        req = await testStack.nextRequest();
        expect(req.url).toBe("http://tus.io/files/");
        expect(req.method).toBe("POST");

        req.respondWith({
          status: 201,
          responseHeaders: {
            Location: "/files/foo"
          }
        });

        req = await testStack.nextRequest();
        expect(req.url).toBe("http://tus.io/files/foo");
        expect(req.method).toBe("PATCH");

        req.respondWith({
          status: 204,
          responseHeaders: {
            "Upload-Offset": 11
          }
        });

        req = await testStack.nextRequest();
        expect(req.url).toBe("http://tus.io/files/foo");
        expect(req.method).toBe("PATCH");
        expect(req.requestHeaders["Upload-Length"]).toBe(11);

        req.respondWith({
          status: 204,
          responseHeaders: {
            "Upload-Offset": 11
          }
        });

        await options.onSuccess.toBeCalled;
      });

      it("should retry the first PATCH request", async function () {
        var reader = makeReader("hello world", 1);

        var testStack = new TestHttpStack();
        var options = {
          httpStack: testStack,
          endpoint: "http://tus.io/files/",
          chunkSize: 11,
          retryDelays: [10, 10, 10],
          onSuccess: waitableFunction("onSuccess"),
          uploadLengthDeferred: true
        };

        var upload = new tus.Upload(reader, options);
        upload.start();

        var req = await testStack.nextRequest();
        expect(req.url).toBe("http://tus.io/files/");
        expect(req.method).toBe("POST");

        req.respondWith({
          status: 201,
          responseHeaders: {
            Location: "/files/foo"
          }
        });

        req = await testStack.nextRequest();
        expect(req.url).toBe("http://tus.io/files/foo");
        expect(req.method).toBe("PATCH");

        req.respondWith({
          status: 500
        });

        req = await testStack.nextRequest();
        expect(req.url).toBe("http://tus.io/files/foo");
        expect(req.method).toBe("HEAD");

        req.respondWith({
          status: 204,
          responseHeaders: {
            "Upload-Offset": 0
          }
        });

        req = await testStack.nextRequest();
        expect(req.url).toBe("http://tus.io/files/foo");
        expect(req.method).toBe("PATCH");

        req.respondWith({
          status: 204,
          responseHeaders: {
            "Upload-Offset": 11
          }
        });

        req = await testStack.nextRequest();
        expect(req.url).toBe("http://tus.io/files/foo");
        expect(req.method).toBe("PATCH");
        expect(req.requestHeaders["Upload-Length"]).toBe(11);

        req.respondWith({
          status: 204,
          responseHeaders: {
            "Upload-Offset": 11
          }
        });

        await options.onSuccess.toBeCalled;
      });

      it("should retry following PATCH requests", async function () {
        var reader = makeReader("hello world there!");

        var testStack = new TestHttpStack();
        var options = {
          httpStack: testStack,
          endpoint: "http://tus.io/files/",
          chunkSize: 6,
          retryDelays: [10, 10, 10],
          onSuccess: function () {},
          uploadLengthDeferred: true
        };

        var upload = new tus.Upload(reader, options);
        upload.start();

        var req = await testStack.nextRequest();
        expect(req.url).toBe("http://tus.io/files/");
        expect(req.method).toBe("POST");

        req.respondWith({
          status: 201,
          responseHeaders: {
            Location: "/files/foo"
          }
        });

        req = await testStack.nextRequest();
        expect(req.url).toBe("http://tus.io/files/foo");
        expect(req.method).toBe("PATCH");

        req.respondWith({
          status: 204,
          responseHeaders: {
            "Upload-Offset": 6
          }
        });

        req = await testStack.nextRequest();
        expect(req.url).toBe("http://tus.io/files/foo");
        expect(req.method).toBe("PATCH");

        req.respondWith({
          status: 500
        });

        req = await testStack.nextRequest();
        expect(req.url).toBe("http://tus.io/files/foo");
        expect(req.method).toBe("HEAD");

        req.respondWith({
          status: 204,
          responseHeaders: {
            "Upload-Offset": 6
          }
        });

        req = await testStack.nextRequest();
        expect(req.url).toBe("http://tus.io/files/foo");
        expect(req.method).toBe("PATCH");

        req.respondWith({
          status: 204,
          responseHeaders: {
            "Upload-Offset": 12
          }
        });

        req = await testStack.nextRequest();
        expect(req.url).toBe("http://tus.io/files/foo");
        expect(req.method).toBe("PATCH");

        req.respondWith({
          status: 204,
          responseHeaders: {
            "Upload-Offset": 18
          }
        });

        req = await testStack.nextRequest();
        expect(req.url).toBe("http://tus.io/files/foo");
        expect(req.method).toBe("PATCH");
        expect(req.requestHeaders["Upload-Length"]).toBe(18);

        req.respondWith({
          status: 204,
          responseHeaders: {
            "Upload-Offset": 18
          }
        });

        await options.onSuccess.toBeCalled;
      });

      it("should cancel the reader when aborted", async function () {
        var reader = makeReader("hello there world");

        var options = {
          httpStack: new TestHttpStack(),
          endpoint: "http://tus.io/files/",
          chunkSize: 6,
          retryDelays: [10, 10, 10],
          onSuccess: function () {},
          uploadLengthDeferred: true
        };

        var upload = new tus.Upload(reader, options);
        upload.start();

        // We wait until the first request arrives, so that the first promises have resolved.
        await options.httpStack.nextRequest();

        upload.abort();

        await reader.cancel.toBeCalled;
        expect(reader.cancel).toHaveBeenCalled();
      });
    });

    describe("resolving of URIs", function () {
      // Disable these tests for IE 10 and 11 because it's not possible to overwrite
      // the navigator.product property.
      var isIE = navigator.userAgent.indexOf("Trident/") > 0;
      if (isIE) {
        console.log("Skipping tests for React Native in Internet Explorer"); // eslint-disable-line no-console
        return;
      }

      var originalProduct = navigator.product;

      beforeEach(function () {
        jasmine.Ajax.install();
        // Simulate React Native environment to enable URIs as input objects.
        Object.defineProperty(navigator, "product", {
          value: "ReactNative",
          configurable: true
        });
      });

      afterEach(function () {
        jasmine.Ajax.uninstall();
        Object.defineProperty(navigator, "product", {
          value: originalProduct,
          configurable: true
        });
      });

      it("should upload a file from an URI", async function () {
        var file = {
          uri: "file:///my/file.dat"
        };
        var testStack = new TestHttpStack();
        var options = {
          httpStack: testStack,
          endpoint: "http://tus.io/uploads",
          onSuccess: waitableFunction("onSuccess")
        };

        var upload = new tus.Upload(file, options);
        upload.start();

        // Wait a short interval to make sure that the XHR has been sent.
        await wait(0);

        var req = jasmine.Ajax.requests.mostRecent();
        expect(req.url).toBe("file:///my/file.dat");
        expect(req.method).toBe("GET");
        expect(req.responseType).toBe("blob");

        req.respondWith({
          status: 200,
          responseHeaders: {
            "Upload-Length": 11,
            "Upload-Offset": 3
          },
          response: new Blob("hello world".split(""))
        });

        req = await testStack.nextRequest();
        expect(req.url).toBe("http://tus.io/uploads");
        expect(req.method).toBe("POST");
        expect(req.requestHeaders["Upload-Length"]).toBe(11);

        req.respondWith({
          status: 201,
          responseHeaders: {
            Location: "/uploads/blargh"
          }
        });

        req = await testStack.nextRequest();
        expect(req.url).toBe("http://tus.io/uploads/blargh");
        expect(req.method).toBe("PATCH");
        expect(req.requestHeaders["Tus-Resumable"]).toBe("1.0.0");
        expect(req.requestHeaders["Upload-Offset"]).toBe(0);
        expect(req.requestHeaders["Content-Type"]).toBe("application/offset+octet-stream");
        expect(req.body.size).toBe(11);

        req.respondWith({
          status: 204,
          responseHeaders: {
            "Upload-Offset": 11
          }
        });

        await options.onSuccess.toBeCalled;
        expect(upload.url).toBe("http://tus.io/uploads/blargh");
      });

      it("should emit an error if it can't resolve the URI", async function () {
        var file = {
          uri: "file:///my/file.dat"
        };
        var options = {
          endpoint: "http://tus.io/uploads",
          onError: waitableFunction("onError")
        };

        var upload = new tus.Upload(file, options);
        upload.start();

        // Wait a short interval to make sure that the XHR has been sent.
        await wait(0);

        var req = jasmine.Ajax.requests.mostRecent();
        expect(req.url).toBe("file:///my/file.dat");
        expect(req.method).toBe("GET");
        expect(req.responseType).toBe("blob");

        req.responseError();

        await options.onError.toBeCalled;
        expect(options.onError).toHaveBeenCalledWith(new Error("tus: cannot fetch `file.uri` as Blob, make sure the uri is correct and accessible. [object Object]"));
      });
    });
  });

  describe("#LocalStorageUrlStorage", function () {
    it("should allow storing and retrieving uploads", async function () {
      await assertUrlStorage(tus.defaultOptions.urlStorage);
    });
  });
});
