const tus = require("../../");
const stream = require("stream");
const temp = require("temp");
const fs = require("fs");

describe("tus", function () {
  describe("#canStoreURLs", function () {
    it("should be false", function () {
      expect(tus.canStoreURLs).toBe(false);
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
      var buffer = new Buffer("hello world");
      var options = {
        endpoint: "/uploads",
        chunkSize: 7
      };

      expectHelloWorldUpload(buffer, options, done);
    });

    it("should reject streams without specifing the size", function () {
      var input = new stream.PassThrough();
      var options = {
        endpoint: "/uploads",
        chunkSize: 100
      };

      var upload = new tus.Upload(input, options);
      expect(upload.start.bind(upload)).toThrow(new Error("tus: cannot automatically derive upload's size from input and must be specified manually using the `uploadSize` option"));
    });

    it("should reject streams without specifing the chunkSize", function () {
      var input = new stream.PassThrough();
      var options = {
        endpoint: "/uploads"
      };

      var upload = new tus.Upload(input, options);
      expect(upload.start.bind(upload)).toThrow(new Error("cannot create source for stream without a finite value for the `chunkSize` option"));
    });

    it("should accept Readable streams", function (done) {
      var input = new stream.PassThrough();
      var options = {
        endpoint: "/uploads",
        chunkSize: 7,
        uploadSize: 11
      };

      input.write("hello WORLD");
      expectHelloWorldUpload(input, options, done);
    });

    it("should accept ReadStreams streams", function (done) {
      // Create a temporary file
      var path = temp.path();
      fs.writeFileSync(path, "hello world");
      var file = fs.createReadStream(path);

      var options = {
        endpoint: "/uploads",
        chunkSize: 7,
        uploadSize: 11
      };

      expectHelloWorldUpload(file, options, done);
    });

    it("should pass through errors from the request", function () {
      var resErr = new Error("something bad, really!");
      var buffer = new Buffer("hello world");
      var option = {
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
  });
});

function expectHelloWorldUpload(input, options, done) {
  var upload = new tus.Upload(input, options);
  upload.start();

  var req = jasmine.Ajax.requests.mostRecent();
  expect(req.url).toBe("/uploads");
  expect(req.method).toBe("POST");
  expect(req.requestHeaders["Upload-Length"]).toBe(11);

  req.respondWith({
    status: 201,
    responseHeaders: {
      Location: "/uploads/blargh"
    }
  });

  req = jasmine.Ajax.requests.mostRecent();
  expect(req.url).toBe("/uploads/blargh");
  expect(req.method).toBe("PATCH");
  expect(req.requestHeaders["Upload-Offset"]).toBe(0);
  expect(req.params.size).toBe(7);

  // Simulate asyncronous responses for requests with bodies which is required
  // if we are dealing with streams.
  process.nextTick(function () {
    req.respondWith({
      status: 204,
      responseHeaders: {
        "Upload-Offset": 7
      }
    });

    req = jasmine.Ajax.requests.mostRecent();
    expect(req.url).toBe("/uploads/blargh");
    expect(req.method).toBe("PATCH");
    expect(req.requestHeaders["Upload-Offset"]).toBe(7);
    expect(req.params.size).toBe(4);

    process.nextTick(function () {
      req.respondWith({
        status: 204,
        responseHeaders: {
          "Upload-Offset": 11
        }
      });

      done();
    });
  });
}

