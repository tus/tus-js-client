const tus = require("../../");
const stream = require("stream");
const temp = require("temp");
const fs = require("fs");

describe("tus", function () {
  describe("#canStoreURLs", function () {
    it("should be true", function () {
      expect(tus.canStoreURLs).toBe(true);
    });
  });

  describe("#Upload", function () {
    beforeEach(function () {
      jasmine.Ajax.install();
    });

    afterEach(function () {
      jasmine.Ajax.uninstall();
    });

    it("should accept Buffers", function (done) {
      var buffer = Buffer.from("hello world");
      var options = {
        resume: false,
        endpoint: "/uploads",
        chunkSize: 7
      };

      expectHelloWorldUpload(buffer, options, done);
    });

    it("should reject streams without specifing the size", function () {
      var input = new stream.PassThrough();
      var options = {
        resume: false,
        endpoint: "/uploads",
        chunkSize: 100
      };

      var upload = new tus.Upload(input, options);
      expect(upload.start.bind(upload)).toThrow(new Error("tus: cannot automatically derive upload's size from input and must be specified manually using the `uploadSize` option"));
    });

    it("should reject streams without specifing the chunkSize", function () {
      var input = new stream.PassThrough();
      var options = {
        resume: false,
        endpoint: "/uploads"
      };

      var upload = new tus.Upload(input, options);
      expect(upload.start.bind(upload)).toThrow(new Error("cannot create source for stream without a finite value for the `chunkSize` option"));
    });

    it("should accept Readable streams", function (done) {
      var input = new stream.PassThrough();
      var options = {
        resume: false,
        endpoint: "/uploads",
        chunkSize: 7,
        uploadSize: 11
      };

      input.end("hello WORLD");
      expectHelloWorldUpload(input, options, done);
    });

    it("should accept Readable streams with deferred size", function (done) {
      var input = new stream.PassThrough();
      var options = {
        resume: false,
        endpoint: "/uploads",
        chunkSize: 7,
        uploadLengthDeferred: true
      };

      input.end("hello WORLD");
      expectHelloWorldUpload(input, options, done);
    });

    it("should accept ReadStreams streams", function (done) {
      // Create a temporary file
      var path = temp.path();
      fs.writeFileSync(path, "hello world");
      var file = fs.createReadStream(path);

      var options = {
        resume: false,
        endpoint: "/uploads",
        chunkSize: 7,
        uploadSize: 11
      };

      expectHelloWorldUpload(file, options, done);
    });

    it("should pass through errors from the request", function () {
      var resErr = new Error("something bad, really!");
      var buffer = Buffer.from("hello world");
      var option = {
        resume: false,
        endpoint: "/uploads",
        onError: function (err) {
          expect(err.causingError).toBe(resErr);
        }
      };

      spyOn(option, "onError").and.callThrough();

      var upload = new tus.Upload(buffer, option);
      upload.start();

      var req = jasmine.Ajax.requests.mostRecent();
      expect(req.url).toBe("/uploads");
      expect(req.method).toBe("POST");

      req.responseError(resErr);

      expect(option.onError).toHaveBeenCalled();
    });

    it("should resume an upload from a stored url", function (done) {
      var storagePath = temp.path();
      fs.writeFileSync(storagePath, "{\"fingerprinted.resume\":\"/uploads/resuming\"}");
      var storage = new tus.FileStorage(storagePath);
      var input = Buffer.from("hello world");
      var options = {
        endpoint: "/uploads",
        fingerprint: (_, __, cb) => cb(null, "fingerprinted.resume"),
        urlStorage: storage
      };

      var upload = new tus.Upload(input, options);
      upload.start();
      var req = jasmine.Ajax.requests.mostRecent();

      setTimeout(() => {
        tickTillNewReq(req, (req) => {
          expect(req.url).toBe("/uploads/resuming");
          expect(req.method).toBe("HEAD");
          expect(req.requestHeaders["Tus-Resumable"]).toBe("1.0.0");

          req.respondWith({
            status: 204,
            responseHeaders: {
              "Upload-Length": 11,
              "Upload-Offset": 3
            }
          });

          expect(upload.url).toBe("/uploads/resuming");

          req = jasmine.Ajax.requests.mostRecent();
          expect(req.url).toBe("/uploads/resuming");
          expect(req.method).toBe("PATCH");
          expect(req.requestHeaders["Tus-Resumable"]).toBe("1.0.0");
          expect(req.requestHeaders["Upload-Offset"]).toBe(3);
          expect(req.contentType()).toBe("application/offset+octet-stream");
          expect(req.params.size).toBe(11 - 3);

          req.respondWith({
            status: 204,
            responseHeaders: {
              "Upload-Offset": 11
            }
          });

          done();
        });
      }, 200);
    });
  });
});

function expectHelloWorldUpload(input, options, done) {
  var upload = new tus.Upload(input, options);
  upload.start();

  var req = jasmine.Ajax.requests.mostRecent();
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

  // Simulate asyncronous responses for requests with bodies which is required
  // if we are dealing with streams.
  tickTillNewReq(req, function (req) {
    expect(req.url).toBe("/uploads/blargh");
    expect(req.method).toBe("PATCH");
    expect(req.requestHeaders["Upload-Offset"]).toBe(0);
    expect(req.params.size).toBe(7);

    req.respondWith({
      status: 204,
      responseHeaders: {
        "Upload-Offset": 7
      }
    });

    tickTillNewReq(req, function (req) {
      expect(req.url).toBe("/uploads/blargh");
      expect(req.method).toBe("PATCH");
      expect(req.requestHeaders["Upload-Offset"]).toBe(7);
      expect(req.params.size).toBe(4);
      req.respondWith({
        status: 204,
        responseHeaders: {
          "Upload-Offset": 11
        }
      });

      if (options.uploadLengthDeferred) {
        tickTillNewReq(req, function (req) {
          expect(req.url).toBe("/uploads/blargh");
          expect(req.method).toBe("PATCH");
          expect(req.params.size).toBe(0);

          req.respondWith({
            status: 204,
            responseHeaders: {
              "Upload-Offset": 11
            }
          });

          tickTillNewReq(req, function (req) {
            expect(req.url).toBe("/uploads/blargh");
            expect(req.method).toBe("PATCH");
            expect(req.params.size).toBe(0);
            expect(req.requestHeaders["Upload-Length"]).toBe(11);
            done();
          });
        });
      } else {
        done();
      }
    });
  });
}

// it keeps ticking till it finds that a new request has been produced
function tickTillNewReq(oldReq, cb, level) {
  const allowedLevels = 5;
  level = level || 0;
  if (level >= allowedLevels) {
    fail(new Error("call level exceeded"));
    return;
  }
  process.nextTick(function () {
    const req = jasmine.Ajax.requests.mostRecent();
    if (oldReq != req) {
      cb(req);
    } else {
      tickTillNewReq(oldReq, cb, level + 1);
    }
  });
}

