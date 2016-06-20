/* global FakeBlob tus */

var hasStorage = tus.canStoreURLs || true;

function expectLocalStorage(key, expectedValue) {
  if (!hasStorage) {
    // Do not evaluate expectations on localStorage in node processes
    return;
  }

  expect(localStorage.getItem(key), expectedValue);
}

function setLocalStorage(key, value) {
  if (!hasStorage) {
    // Do not evaluate expectations on localStorage in node processes
    return;
  }

  localStorage.setItem(key, value);
}

function clearLocalStorage() {
  if (!hasStorage) {
    // Do not evaluate expectations on localStorage in node processes
    return;
  }

  localStorage.clear();
}

describe("tus", function () {
  describe("#Upload", function () {

    beforeEach(function () {
      jasmine.Ajax.install();
      clearLocalStorage();
    });

    afterEach(function () {
      jasmine.Ajax.uninstall();
    });

    it("should resume an upload from a stored url", function (done) {
      setLocalStorage("fingerprinted", "/uploads/resuming");

      var file = new FakeBlob("hello world".split(""));
      var options = {
        endpoint: "/uploads",
        onProgress: function () {},
        fingerprint: function () {}
      };
      spyOn(options, "fingerprint").and.returnValue("fingerprinted");
      spyOn(options, "onProgress");

      var upload = new tus.Upload(file, options);
      upload.start();

      expect(options.fingerprint).toHaveBeenCalledWith(file);

      var req = jasmine.Ajax.requests.mostRecent();
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

      expect(options.onProgress).toHaveBeenCalledWith(11, 11);
      done();
    });

    it("should store upload urls", function (done) {
      var file = new FakeBlob("hello world".split(""));
      var options = {
        endpoint: "/uploads",
        fingerprint: function () {}
      };
      spyOn(options, "fingerprint").and.returnValue("fingerprinted");

      var upload = new tus.Upload(file, options);
      upload.start();

      expect(options.fingerprint).toHaveBeenCalledWith(file);

      var req = jasmine.Ajax.requests.mostRecent();
      expect(req.url).toBe("/uploads");
      expect(req.method).toBe("POST");

      req.respondWith({
        status: 201,
        responseHeaders: {
          Location: "/uploads/blargh"
        }
      });

      expect(upload.url).toBe("/uploads/blargh");
      expectLocalStorage("fingerprinted", "/uploads/blargh");
      done();
    });
  });
});
