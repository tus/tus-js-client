/* global expectAsync */
const { TestHttpStack, getBlob } = require("./helpers/utils");
const tus = require("../../");

describe("tus", function () {
  describe("terminate upload", function () {
    it("should terminate upload when abort is called with true", async function () {
      let abortPromise;
      const testStack = new TestHttpStack();
      var file = getBlob("hello world");
      var options = {
        httpStack: testStack,
        endpoint: "http://tus.io/files/",
        chunkSize: 5,
        onChunkComplete: function () {
          abortPromise = upload.abort(true);
        }
      };

      spyOn(options, "onChunkComplete").and.callThrough();

      const upload = new tus.Upload(file, options);
      upload.start();

      let req = await testStack.nextRequest();
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
          "Upload-Offset": 5
        }
      });

      req = await testStack.nextRequest();
      expect(req.url).toBe("http://tus.io/files/foo");
      expect(req.method).toBe("DELETE");

      req.respondWith({
        status: 204
      });

      expect(options.onChunkComplete).toHaveBeenCalled();
      await abortPromise;
    });

    it("should retry terminate when an error is returned on first try", async function () {
      let abortPromise;
      const testStack = new TestHttpStack();
      var file = getBlob("hello world");
      var options = {
        httpStack: testStack,
        endpoint: "http://tus.io/files/",
        chunkSize: 5,
        retryDelays: [10, 10, 10],
        onChunkComplete: function () {
          abortPromise = upload.abort(true);
        }
      };

      spyOn(options, "onChunkComplete").and.callThrough();

      const upload = new tus.Upload(file, options);
      upload.start();

      let req = await testStack.nextRequest();
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
          "Upload-Offset": 5
        }
      });

      req = await testStack.nextRequest();
      expect(req.url).toBe("http://tus.io/files/foo");
      expect(req.method).toBe("DELETE");

      req.respondWith({
        status: 423
      });

      req = await testStack.nextRequest();
      expect(req.url).toBe("http://tus.io/files/foo");
      expect(req.method).toBe("DELETE");

      req.respondWith({
        status: 204
      });

      await abortPromise;
      expect(options.onChunkComplete).toHaveBeenCalled();
    });

    it("should stop retrying when all delays are used up", async function () {
      const testStack = new TestHttpStack();
      var options = {
        httpStack: testStack,
        retryDelays: [10, 10]
      };

      const terminatePromise = tus.Upload.terminate("http://tus.io/files/foo", options);

      let req = await testStack.nextRequest();
      expect(req.url).toBe("http://tus.io/files/foo");
      expect(req.method).toBe("DELETE");

      req.respondWith({
        status: 500
      });

      req = await testStack.nextRequest();
      expect(req.url).toBe("http://tus.io/files/foo");
      expect(req.method).toBe("DELETE");

      req.respondWith({
        status: 500
      });

      req = await testStack.nextRequest();
      expect(req.url).toBe("http://tus.io/files/foo");
      expect(req.method).toBe("DELETE");

      req.respondWith({
        status: 500
      });

      await expectAsync(terminatePromise).toBeRejectedWithError(/tus: unexpected response while terminating upload/);
    });

    it("should invoke the request and response Promises", async function () {
      const testStack = new TestHttpStack();
      var options = {
        httpStack: testStack,
        onBeforeRequest: function (req) {
          return new Promise(resolve => {
            expect(req.getURL()).toBe("http://tus.io/uploads/foo");
            expect(req.getMethod()).toBe("DELETE");
            resolve();
          });
        },
        onAfterResponse: function (req, res) {
          return new Promise(resolve => {
            expect(req.getURL()).toBe("http://tus.io/uploads/foo");
            expect(req.getMethod()).toBe("DELETE");
            expect(res.getStatus()).toBe(204);
            resolve();
          });
        }
      };
      spyOn(options, "onBeforeRequest");
      spyOn(options, "onAfterResponse");

      const terminatePromise = tus.Upload.terminate("http://tus.io/uploads/foo", options);

      let req = await testStack.nextRequest();
      expect(req.url).toBe("http://tus.io/uploads/foo");
      expect(req.method).toBe("DELETE");

      req.respondWith({
        status: 204
      });

      await expectAsync(terminatePromise).toBeResolved();
      expect(options.onBeforeRequest).toHaveBeenCalled();
      expect(options.onAfterResponse).toHaveBeenCalled();
    });
  });
});
