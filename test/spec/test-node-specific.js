const { TestHttpStack, waitableFunction } = require("./helpers/utils");
const assertUrlStorage = require("./helpers/assertUrlStorage");
const tus = require("../../");
const stream = require("stream");
const temp = require("temp");
const fs = require("fs");
const https = require("https");

describe("tus", function () {
  describe("#canStoreURLs", function () {
    it("should be true", function () {
      expect(tus.canStoreURLs).toBe(true);
    });
  });

  describe("#Upload", function () {
    it("should accept Buffers", async function () {
      var buffer = Buffer.from("hello world");
      var options = {
        httpStack: new TestHttpStack(),
        endpoint: "/uploads",
        chunkSize: 7
      };

      await expectHelloWorldUpload(buffer, options);
    });

    it("should reject streams without specifying the size", async function () {
      var input = new stream.PassThrough();
      var options = {
        endpoint: "/uploads",
        chunkSize: 100,
        onError: waitableFunction("onError")
      };

      var upload = new tus.Upload(input, options);
      upload.start();

      const err = await options.onError.toBeCalled;
      expect(err.message).toBe("tus: cannot automatically derive upload's size from input and must be specified manually using the `uploadSize` option");
    });

    it("should reject streams without specifying the chunkSize", async function () {
      var input = new stream.PassThrough();
      var options = {
        endpoint: "/uploads",
        onError: waitableFunction("onError")
      };

      var upload = new tus.Upload(input, options);
      upload.start();

      const err = await options.onError.toBeCalled;
      expect(err.message).toBe("cannot create source for stream without a finite value for the `chunkSize` option");
    });

    it("should accept Readable streams", async function () {
      var input = new stream.PassThrough();
      var options = {
        httpStack: new TestHttpStack(),
        endpoint: "/uploads",
        chunkSize: 7,
        uploadSize: 11
      };

      input.end("hello WORLD");
      await expectHelloWorldUpload(input, options);
    });

    it("should accept Readable streams with deferred size", async function () {
      var input = new stream.PassThrough();
      var options = {
        httpStack: new TestHttpStack(),
        endpoint: "/uploads",
        chunkSize: 7,
        uploadLengthDeferred: true
      };

      input.end("hello WORLD");
      await expectHelloWorldUpload(input, options);
    });

    it("should accept ReadStreams streams", async function () {
      // Create a temporary file
      var path = temp.path();
      fs.writeFileSync(path, "hello world");
      var file = fs.createReadStream(path);

      var options = {
        httpStack: new TestHttpStack(),
        endpoint: "/uploads",
        chunkSize: 7,
        uploadSize: 11
      };

      await expectHelloWorldUpload(file, options);
    });

    it("should pass through errors from the request", async function () {
      var resErr = new Error("something bad, really!");
      var buffer = Buffer.from("hello world");
      var options = {
        httpStack: new TestHttpStack(),
        endpoint: "/uploads",
        onError: waitableFunction("onError"),
        retryDelays: null
      };

      var upload = new tus.Upload(buffer, options);
      upload.start();

      var req = await options.httpStack.nextRequest();
      expect(req.url).toBe("/uploads");
      expect(req.method).toBe("POST");

      req.responseError(resErr);

      const err = await options.onError.toBeCalled;
      expect(err.causingError).toBe(resErr);
    });

    it("should resume an upload from a stored url", async function () {
      var storagePath = temp.path();
      fs.writeFileSync(storagePath, "{\"tus::fingerprinted::1337\":{\"uploadUrl\":\"http://tus.io/uploads/resuming\"}}");
      var storage = new tus.FileUrlStorage(storagePath);
      var input = Buffer.from("hello world");
      var options = {
        httpStack: new TestHttpStack(),
        endpoint: "/uploads",
        fingerprint: function () {},
        urlStorage: storage,
        onSuccess: waitableFunction("onSuccess")
      };
      spyOn(options, "fingerprint").and.resolveTo("fingerprinted");

      var upload = new tus.Upload(input, options);

      const previousUploads = await upload.findPreviousUploads();
      expect(previousUploads).toEqual([{
        uploadUrl: "http://tus.io/uploads/resuming",
        urlStorageKey: "tus::fingerprinted::1337"
      }]);
      upload.resumeFromPreviousUpload(previousUploads[0]);

      upload.start();

      expect(options.fingerprint).toHaveBeenCalledWith(input, upload.options);

      var req = await options.httpStack.nextRequest();
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

      expect(upload.url).toBe("http://tus.io/uploads/resuming");

      req = await options.httpStack.nextRequest();
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

      await options.onSuccess.toBeCalled;
    });
  });

  describe("#FileUrlStorage", function () {
    it("should allow storing and retrieving uploads", async function () {
      var storagePath = temp.path();
      var storage = new tus.FileUrlStorage(storagePath);
      await assertUrlStorage(storage);
    });
  });

  describe("#NodeHttpStack", function () {
    it("should allow to pass options to Node's requests", async function () {
      const customAgent = new https.Agent();
      const stack = (new tus.HttpStack({
        agent: customAgent
      }));
      const req = stack.createRequest("GET", "https://master.tus.io/");
      await req.send();
      expect(req.getUnderlyingObject().agent).toBe(customAgent);
      expect(req.getUnderlyingObject().agent).not.toBe(https.globalAgent);
    });
  });
});

async function getBodySize(body) {
  if (body == null) {
    return 0;
  }

  if (body.size != null) {
    return body.size;
  }

  return new Promise((resolve) => {
    body.on("readable", () => {
      let chunk;
      while (null !== (chunk = body.read())) {
        resolve(chunk.length);
      }
    });
  });
}

async function expectHelloWorldUpload(input, options) {
  options.httpStack = new TestHttpStack();
  options.onSuccess = waitableFunction("onSuccess");

  var upload = new tus.Upload(input, options);
  upload.start();

  var req = await options.httpStack.nextRequest();
  expect(req.url).toBe("/uploads");
  expect(req.method).toBe("POST");
  if (options.uploadLengthDeferred) {
    expect(req.requestHeaders["Upload-Length"]).toBe(undefined);
    expect(req.requestHeaders["Upload-Defer-Length"]).toBe(1);
  } else {
    expect(req.requestHeaders["Upload-Length"]).toBe(11);
    expect(req.requestHeaders["Upload-Defer-Length"]).toBe(undefined);
  }

  req.respondWith({
    status: 201,
    responseHeaders: {
      Location: "/uploads/blargh"
    }
  });

  req = await options.httpStack.nextRequest();
  expect(req.url).toBe("/uploads/blargh");
  expect(req.method).toBe("PATCH");
  expect(req.requestHeaders["Upload-Offset"]).toBe(0);
  expect(await getBodySize(req.body)).toBe(7);

  req.respondWith({
    status: 204,
    responseHeaders: {
      "Upload-Offset": 7
    }
  });

  req = await options.httpStack.nextRequest();
  expect(req.url).toBe("/uploads/blargh");
  expect(req.method).toBe("PATCH");
  expect(req.requestHeaders["Upload-Offset"]).toBe(7);
  expect(await getBodySize(req.body)).toBe(4);
  req.respondWith({
    status: 204,
    responseHeaders: {
      "Upload-Offset": 11
    }
  });

  if (options.uploadLengthDeferred) {
    req = await options.httpStack.nextRequest();
    expect(req.url).toBe("/uploads/blargh");
    expect(req.method).toBe("PATCH");
    expect(req.requestHeaders["Upload-Length"]).toBe(11);
    expect(await getBodySize(req.body)).toBe(0);

    req.respondWith({
      status: 204,
      responseHeaders: {
        "Upload-Offset": 11,
        "Upload-Length": 11
      }
    });
  }

  await options.onSuccess.toBeCalled;
}
