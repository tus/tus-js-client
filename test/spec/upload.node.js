var tus = require("../../");
var stream = require("stream");
var temp = require("temp");
var fs = require("fs");

describe("tus", function () {
  describe("#isSupported", function () {
    it("should be true", function () {
      expect(tus.isSupported).toBe(true);
    });
  });

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

    it("should accept Buffers", function () {
      var buffer = new Buffer("hello world");
      var options = {
        endpoint: "/uploads",
        chunkSize: 7
      };

      expectHelloWorldUpload(buffer, options);
    });

    it("should reject streams without specifing the size", function () {
      var input = new stream.PassThrough();
      var options = {
        endpoint: "/uploads"
      };

      var upload = new tus.Upload(input, options);
      expect(upload.start.bind(upload)).toThrow(new Error("tus: cannot automatically derive upload's size from input and must be specified manually using the `uploadSize` option"));
    });

    it("should accept Readable streams", function () {
      var input = new stream.PassThrough();
      var options = {
        endpoint: "/uploads",
        chunkSize: 7,
        uploadSize: 11
      };

      input.write("hello world");
      expectHelloWorldUpload(input, options);
    });

    it("should accept ReadStreams streams", function () {
      // Create a temporary file
      var path = temp.path();
      fs.writeFileSync(path, "hello world");
      var file = fs.createReadStream(path);

      var options = {
        endpoint: "/uploads",
        chunkSize: 7,
        uploadSize: 11
      };

      expectHelloWorldUpload(file, options);
    });
  });
});

function expectHelloWorldUpload(input, options) {
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

  req.respondWith({
    status: 204,
    responseHeaders: {
      "Upload-Offset": 11
    }
  });
}
