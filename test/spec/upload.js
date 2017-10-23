/* global FakeBlob tus */

var isBrowser  = typeof window !== "undefined";
var isNode     = !isBrowser;

describe("tus", function () {
  describe("#Upload", function () {

    beforeEach(function () {
      jasmine.Ajax.install();

      // Clear localStorage before every test to prevent stored URLs to
      // interfere with our setup.
      if (isBrowser) {
        localStorage.clear();
      }
    });

    afterEach(function () {
      jasmine.Ajax.uninstall();
    });

    it("should throw if no error handler is available", function () {
      var upload = new tus.Upload(null);
      expect(upload.start.bind(upload)).toThrowError("tus: no file or stream to upload provided");
    });

    it("should upload a file", function (done) {
      var file = new FakeBlob("hello world".split(""));
      var options = {
        endpoint: "http://tus.io/uploads",
        headers: {
          Custom: "blargh"
        },
        metadata: {
          foo: "hello",
          bar: "world",
          nonlatin: "słońce",
          number: 100
        },
        withCredentials: true,
        onProgress: function () {},
        fingerprint: function () {}
      };
      spyOn(options, "fingerprint").and.returnValue("fingerprinted");
      spyOn(options, "onProgress");

      var upload = new tus.Upload(file, options);
      upload.start();

      expect(options.fingerprint).toHaveBeenCalledWith(file);

      var req = jasmine.Ajax.requests.mostRecent();
      expect(req.url).toBe("http://tus.io/uploads");
      expect(req.method).toBe("POST");
      expect(req.requestHeaders.Custom).toBe("blargh");
      expect(req.requestHeaders["Tus-Resumable"]).toBe("1.0.0");
      expect(req.requestHeaders["Upload-Length"]).toBe(11);
      if (isBrowser) expect(req.withCredentials).toBe(true);
      if (isNode || (isBrowser && "btoa" in window)) {
        expect(req.requestHeaders["Upload-Metadata"]).toBe("foo aGVsbG8=,bar d29ybGQ=,nonlatin c8WCb8WEY2U=,number MTAw");
      }

      req.respondWith({
        status: 201,
        responseHeaders: {
          Location: "http://tus.io/uploads/blargh"
        }
      });

      expect(upload.url).toBe("http://tus.io/uploads/blargh");

      req = jasmine.Ajax.requests.mostRecent();
      expect(req.url).toBe("http://tus.io/uploads/blargh");
      expect(req.method).toBe("PATCH");
      expect(req.requestHeaders.Custom).toBe("blargh");
      expect(req.requestHeaders["Tus-Resumable"]).toBe("1.0.0");
      expect(req.requestHeaders["Upload-Offset"]).toBe(0);
      expect(req.contentType()).toBe("application/offset+octet-stream");
      expect(req.params.size).toBe(11);
      if (isBrowser) expect(req.withCredentials).toBe(true);

      req.respondWith({
        status: 204,
        responseHeaders: {
          "Upload-Offset": 11
        }
      });

      expect(options.onProgress).toHaveBeenCalledWith(11, 11);
      done();
    });

    it("should create an upload if resuming fails", function (done) {
      var file = new FakeBlob("hello world".split(""));
      var options = {
        endpoint: "http://tus.io/uploads",
        uploadUrl: "http://tus.io/uploads/resuming"
      };

      var upload = new tus.Upload(file, options);
      upload.start();

      var req = jasmine.Ajax.requests.mostRecent();
      expect(req.url).toBe("http://tus.io/uploads/resuming");
      expect(req.method).toBe("HEAD");
      expect(req.requestHeaders["Tus-Resumable"]).toBe("1.0.0");

      req.respondWith({
        status: 404
      });

      expect(upload.url).toBe(null);

      req = jasmine.Ajax.requests.mostRecent();
      expect(req.url).toBe("http://tus.io/uploads");
      expect(req.method).toBe("POST");
      expect(req.requestHeaders["Tus-Resumable"]).toBe("1.0.0");
      expect(req.requestHeaders["Upload-Length"]).toBe(11);
      done();
    });

    it("should resolve relative URLs", function () {
      var file = new FakeBlob("hello world".split(""));
      var options = {
        endpoint: "http://master.tus.io:1080/files/"
      };

      var upload = new tus.Upload(file, options);
      upload.start();

      var req = jasmine.Ajax.requests.mostRecent();
      expect(req.url).toBe("http://master.tus.io:1080/files/");
      expect(req.method).toBe("POST");

      req.respondWith({
        status: 201,
        responseHeaders: {
          "Location": "//localhost/uploads/foo"
        }
      });

      expect(upload.url).toBe("http://localhost/uploads/foo");

      req = jasmine.Ajax.requests.mostRecent();
      expect(req.url).toBe("http://localhost/uploads/foo");
      expect(req.method).toBe("PATCH");

      req.respondWith({
        status: 204,
        responseHeaders: {
          "Upload-Offset": 11
        }
      });
    });

    it("should upload a file in chunks", function (done) {
      var file = new FakeBlob("hello world".split(""));
      var options = {
        endpoint: "http://tus.io/uploads",
        chunkSize: 7,
        onProgress: function () {},
        onChunkComplete: function () {},
        fingerprint: function () {}
      };
      spyOn(options, "fingerprint").and.returnValue("fingerprinted");
      spyOn(options, "onProgress");
      spyOn(options, "onChunkComplete");

      var upload = new tus.Upload(file, options);
      upload.start();

      expect(options.fingerprint).toHaveBeenCalledWith(file);

      var req = jasmine.Ajax.requests.mostRecent();
      expect(req.url).toBe("http://tus.io/uploads");
      expect(req.method).toBe("POST");
      expect(req.requestHeaders["Tus-Resumable"]).toBe("1.0.0");
      expect(req.requestHeaders["Upload-Length"]).toBe(11);

      req.respondWith({
        status: 201,
        responseHeaders: {
          Location: "/uploads/blargh"
        }
      });

      expect(upload.url).toBe("http://tus.io/uploads/blargh");

      req = jasmine.Ajax.requests.mostRecent();
      expect(req.url).toBe("http://tus.io/uploads/blargh");
      expect(req.method).toBe("PATCH");
      expect(req.requestHeaders["Tus-Resumable"]).toBe("1.0.0");
      expect(req.requestHeaders["Upload-Offset"]).toBe(0);
      expect(req.contentType()).toBe("application/offset+octet-stream");
      expect(req.params.size).toBe(7);

      req.respondWith({
        status: 204,
        responseHeaders: {
          "Upload-Offset": 7
        }
      });

      req = jasmine.Ajax.requests.mostRecent();
      expect(req.url).toBe("http://tus.io/uploads/blargh");
      expect(req.method).toBe("PATCH");
      expect(req.requestHeaders["Tus-Resumable"]).toBe("1.0.0");
      expect(req.requestHeaders["Upload-Offset"]).toBe(7);
      expect(req.contentType()).toBe("application/offset+octet-stream");
      expect(req.params.size).toBe(4);

      req.respondWith({
        status: 204,
        responseHeaders: {
          "Upload-Offset": 11
        }
      });
      expect(options.onProgress).toHaveBeenCalledWith(11, 11);
      expect(options.onChunkComplete).toHaveBeenCalledWith(7, 7, 11);
      expect(options.onChunkComplete).toHaveBeenCalledWith(4, 11, 11);
      done();
    });

    it("should add the original request to errors", function () {
      var file = new FakeBlob("hello world".split(""));
      var err;
      var options = {
        endpoint: "http://tus.io/uploads",
        onError: function (e) {
          err = e;
        }
      };

      var upload = new tus.Upload(file, options);
      upload.start();

      var req = jasmine.Ajax.requests.mostRecent();
      expect(req.url).toBe("http://tus.io/uploads");
      expect(req.method).toBe("POST");

      req.respondWith({
        status: 500,
        responseHeaders: {
          Custom: "blargh"
        }
      });

      expect(upload.url).toBe(null);

      expect(err.message).toBe("tus: unexpected response while creating upload, originated from request (response code: 500, response text: )");
      expect(err.originalRequest).toBeDefined();
      expect(err.originalRequest.getResponseHeader("Custom")).toBe("blargh");
    });

    it("should not resume a finished upload", function (done) {
      var file = new FakeBlob("hello world".split(""));
      var options = {
        endpoint: "http://tus.io/uploads",
        onProgress: function () {},
        onSuccess: function () {},
        uploadUrl: "http://tus.io/uploads/resuming"
      };
      spyOn(options, "onProgress");
      spyOn(options, "onSuccess");

      var upload = new tus.Upload(file, options);
      upload.start();

      var req = jasmine.Ajax.requests.mostRecent();
      expect(req.url).toBe("http://tus.io/uploads/resuming");
      expect(req.method).toBe("HEAD");
      expect(req.requestHeaders["Tus-Resumable"]).toBe("1.0.0");

      req.respondWith({
        status: 204,
        responseHeaders: {
          "Upload-Length": "11",
          "Upload-Offset": "11"
        }
      });

      expect(options.onProgress).toHaveBeenCalledWith(11, 11);
      expect(options.onSuccess).toHaveBeenCalled();
      done();
    });

    it("should resume an upload from a specified url", function (done) {
      var file = new FakeBlob("hello world".split(""));
      var options = {
        endpoint: "http://tus.io/uploads",
        uploadUrl: "http://tus.io/files/upload",
        onProgress: function () {},
        fingerprint: function () {}
      };
      spyOn(options, "fingerprint").and.returnValue("fingerprinted");
      spyOn(options, "onProgress");

      var upload = new tus.Upload(file, options);
      upload.start();

      expect(options.fingerprint.calls.count()).toEqual(0);
      expect(upload.url).toBe("http://tus.io/files/upload");

      var req = jasmine.Ajax.requests.mostRecent();
      expect(req.url).toBe("http://tus.io/files/upload");
      expect(req.method).toBe("HEAD");
      expect(req.requestHeaders["Tus-Resumable"]).toBe("1.0.0");

      req.respondWith({
        status: 204,
        responseHeaders: {
          "Upload-Length": 11,
          "Upload-Offset": 3
        }
      });

      req = jasmine.Ajax.requests.mostRecent();
      expect(req.url).toBe("http://tus.io/files/upload");
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

    it("should resume a previously started upload", function (done) {
      var file = new FakeBlob("hello world".split(""));
      var options = {
        resume: false,
        endpoint: "http://tus.io/uploads",
        onSuccess: function () {}
      };
      spyOn(options, "onSuccess");

      var upload = new tus.Upload(file, options);
      upload.start();

      var req = jasmine.Ajax.requests.mostRecent();
      expect(req.url).toBe("http://tus.io/uploads");
      expect(req.method).toBe("POST");

      req.respondWith({
        status: 201,
        responseHeaders: {
          Location: "http://tus.io/uploads/blargh"
        }
      });

      req = jasmine.Ajax.requests.mostRecent();
      expect(req.url).toBe("http://tus.io/uploads/blargh");
      expect(req.method).toBe("PATCH");

      upload.abort();

      req.respondWith({
        status: 204,
        responseHeaders: {
          "Upload-Offset": 5
        }
      });

      upload.start();

      req = jasmine.Ajax.requests.mostRecent();
      expect(req.url).toBe("http://tus.io/uploads/blargh");
      expect(req.method).toBe("HEAD");

      req.respondWith({
        status: 204,
        responseHeaders: {
          "Upload-Offset": 5,
          "Upload-Length": 11
        }
      });

      req = jasmine.Ajax.requests.mostRecent();
      expect(req.url).toBe("http://tus.io/uploads/blargh");
      expect(req.method).toBe("PATCH");

      req.respondWith({
        status: 204,
        responseHeaders: {
          "Upload-Offset": 11
        }
      });

      expect(options.onSuccess).toHaveBeenCalled();
      done();
    });

    it("should override the PATCH method", function (done) {
      var file = new FakeBlob("hello world".split(""));
      var options = {
        endpoint: "http://tus.io/uploads",
        uploadUrl: "http://tus.io/files/upload",
        overridePatchMethod: true
      };

      var upload = new tus.Upload(file, options);
      upload.start();

      var req = jasmine.Ajax.requests.mostRecent();
      expect(req.url).toBe("http://tus.io/files/upload");
      expect(req.method).toBe("HEAD");
      expect(req.requestHeaders["Tus-Resumable"]).toBe("1.0.0");

      req.respondWith({
        status: 204,
        responseHeaders: {
          "Upload-Length": 11,
          "Upload-Offset": 3
        }
      });

      req = jasmine.Ajax.requests.mostRecent();
      expect(req.url).toBe("http://tus.io/files/upload");
      expect(req.method).toBe("POST");
      expect(req.requestHeaders["Tus-Resumable"]).toBe("1.0.0");
      expect(req.requestHeaders["Upload-Offset"]).toBe(3);
      expect(req.requestHeaders["X-HTTP-Method-Override"]).toBe("PATCH");

      req.respondWith({
        status: 204,
        responseHeaders: {
          "Upload-Offset": 11
        }
      });

      done();
    });

    it("should emit an error if an upload is locked", function (done) {
      var file = new FakeBlob("hello world".split(""));
      var options = {
        endpoint: "http://tus.io/uploads",
        uploadUrl: "http://tus.io/files/upload",
        onError: function () {}
      };

      spyOn(options, "onError");

      var upload = new tus.Upload(file, options);
      upload.start();

      var req = jasmine.Ajax.requests.mostRecent();
      expect(req.url).toBe("http://tus.io/files/upload");
      expect(req.method).toBe("HEAD");

      req.respondWith({
        status: 423 // Locked
      });

      expect(options.onError).toHaveBeenCalledWith(new Error("tus: upload is currently locked; retry later, originated from request (response code: 423, response text: )"));
      done();
    });

    it("should emit an error if no Location header is presented", function (done) {
      var file = new FakeBlob("hello world".split(""));
      var options = {
        endpoint: "http://tus.io/uploads",
        onError: function () {}
      };

      spyOn(options, "onError");

      var upload = new tus.Upload(file, options);
      upload.start();

      var req = jasmine.Ajax.requests.mostRecent();
      expect(req.url).toBe("http://tus.io/uploads");
      expect(req.method).toBe("POST");
      // The Location header is omitted on purpose here

      req.respondWith({
        status: 201
      });

      expect(options.onError).toHaveBeenCalledWith(new Error("tus: invalid or missing Location header, originated from request (response code: 201, response text: )"));
      done();
    });

    it("should throw if retryDelays is not an array", function () {
      var file = new FakeBlob("hello world".split(""));
      var upload = new tus.Upload(file, {
        endpoint: "http://endpoint/",
        retryDelays: 44
      });
      expect(upload.start.bind(upload)).toThrowError("tus: the `retryDelays` option must either be an array or null");
    });

    it("should retry the upload", function (done) {
      var file = new FakeBlob("hello world".split(""));
      var options = {
        endpoint: "http://tus.io/files/",
        retryDelays: [10, 10, 10],
        onSuccess: function () {}
      };

      spyOn(options, "onSuccess");

      var upload = new tus.Upload(file, options);
      upload.start();

      var req = jasmine.Ajax.requests.mostRecent();
      expect(req.url).toBe("http://tus.io/files/");
      expect(req.method).toBe("POST");

      req.respondWith({
        status: 500
      });

      setTimeout(function () {
        req = jasmine.Ajax.requests.mostRecent();
        expect(req.url).toBe("http://tus.io/files/");
        expect(req.method).toBe("POST");

        req.respondWith({
          status: 201,
          responseHeaders: {
            Location: "/files/foo"
          }
        });

        req = jasmine.Ajax.requests.mostRecent();
        expect(req.url).toBe("http://tus.io/files/foo");
        expect(req.method).toBe("PATCH");

        req.respondWith({
          status: 204,
          responseHeaders: {
            "Upload-Offset": 11
          }
        });

        expect(options.onSuccess).toHaveBeenCalled();
        done();
      }, 20);
    });

    it("should not retry if the error has not been caused by a request", function () {
      var file = new FakeBlob("hello world".split(""));
      var options = {
        endpoint: "http://tus.io/files/",
        retryDelays: [10, 10, 10],
        onSuccess: function () {},
        onError: function () {}
      };

      spyOn(options, "onSuccess");
      spyOn(options, "onError");

      var upload = new tus.Upload(file, options);
      spyOn(upload, "_createUpload");
      upload.start();


      var error = new Error("custom error");
      upload._emitError(error);

      expect(upload._createUpload).toHaveBeenCalledTimes(1);
      expect(options.onError).toHaveBeenCalledWith(error);
      expect(options.onSuccess).not.toHaveBeenCalled();
    });

    it("should stop retrying after all delays have been used", function (done) {
      var file = new FakeBlob("hello world".split(""));
      var options = {
        endpoint: "http://tus.io/files/",
        retryDelays: [10],
        onSuccess: function () {},
        onError: function () {}
      };

      spyOn(options, "onSuccess");
      spyOn(options, "onError");

      var upload = new tus.Upload(file, options);
      upload.start();

      var req = jasmine.Ajax.requests.mostRecent();
      expect(req.url).toBe("http://tus.io/files/");
      expect(req.method).toBe("POST");

      req.respondWith({
        status: 500
      });

      setTimeout(function () {
        expect(options.onError).not.toHaveBeenCalled();

        var req = jasmine.Ajax.requests.mostRecent();
        expect(req.url).toBe("http://tus.io/files/");
        expect(req.method).toBe("POST");

        req.respondWith({
          status: 500
        });

        expect(options.onSuccess).not.toHaveBeenCalled();
        expect(options.onError).toHaveBeenCalledTimes(1);
        done();
      }, 200);
    });

    it("should stop retrying when the abort function is called", function (done) {
      var file = new FakeBlob("hello world".split(""));
      var options = {
        endpoint: "http://tus.io/files/",
        retryDelays: [100],
        onError: function () {}
      };

      spyOn(options, "onError");

      var upload = new tus.Upload(file, options);
      upload.start();

      var req = jasmine.Ajax.requests.mostRecent();
      expect(req.url).toBe("http://tus.io/files/");
      expect(req.method).toBe("POST");

      spyOn(upload, "start");

      req.respondWith({
        status: 500
      });

      upload.abort();

      setTimeout(function () {
        expect(upload.start).not.toHaveBeenCalled();
        done();
      }, 200);
    });

    it("should stop upload when the abort function is called during a callback", function (done) {
      var upload;
      var file = new FakeBlob("hello world".split(""));
      var options = {
        endpoint: "http://tus.io/files/",
        chunkSize: 5,
        onChunkComplete: function () {
          upload.abort();
        }
      };

      spyOn(options, "onChunkComplete").and.callThrough();

      upload = new tus.Upload(file, options);
      upload.start();

      var req = jasmine.Ajax.requests.mostRecent();
      expect(req.url).toBe("http://tus.io/files/");
      expect(req.method).toBe("POST");

      req.respondWith({
        status: 201,
        responseHeaders: {
          Location: "/files/foo"
        }
      });

      req = jasmine.Ajax.requests.mostRecent();
      expect(req.url).toBe("http://tus.io/files/foo");
      expect(req.method).toBe("PATCH");

      req.respondWith({
        status: 204,
        responseHeaders: {
          "Upload-Offset": 5
        }
      });

      setTimeout(function () {
        expect(options.onChunkComplete).toHaveBeenCalled();
        expect(jasmine.Ajax.requests.mostRecent()).toBe(req);
        done();
      }, 200);
    });

    it("should stop upload when the abort function is called during the POST request", function (done) {
      var file = new FakeBlob("hello world".split(""));
      var options = {
        endpoint: "http://tus.io/files/",
        onError: function () {}
      };

      spyOn(options, "onError");

      var upload = new tus.Upload(file, options);
      upload.start();

      upload.abort();

      var req = jasmine.Ajax.requests.mostRecent();
      expect(req.url).toBe("http://tus.io/files/");
      expect(req.method).toBe("POST");

      req.respondWith({
        status: 201,
        responseHeaders: {
          Location: "/files/foo"
        }
      });

      setTimeout(function () {
        expect(options.onError).not.toHaveBeenCalled();
        expect(jasmine.Ajax.requests.mostRecent()).toBe(req);
        done();
      }, 200);
    });

    it("should reset the attempt counter if an upload proceeds", function (done) {
      var file = new FakeBlob("hello world".split(""));
      var options = {
        endpoint: "http://tus.io/files/",
        retryDelays: [10],
        onError: function () {},
        onSuccess: function () {}
      };

      spyOn(options, "onError");
      spyOn(options, "onSuccess");

      var upload = new tus.Upload(file, options);
      upload.start();

      var req = jasmine.Ajax.requests.mostRecent();
      expect(req.url).toBe("http://tus.io/files/");
      expect(req.method).toBe("POST");

      req.respondWith({
        status: 201,
        responseHeaders: {
          Location: "/files/foo"
        }
      });

      req = jasmine.Ajax.requests.mostRecent();
      expect(req.url).toBe("http://tus.io/files/foo");
      expect(req.method).toBe("PATCH");

      req.respondWith({
        status: 500
      });

      setTimeout(function () {
        req = jasmine.Ajax.requests.mostRecent();
        expect(req.url).toBe("http://tus.io/files/foo");
        expect(req.method).toBe("HEAD");

        req.respondWith({
          status: 204,
          responseHeaders: {
            "Upload-Offset": 0,
            "Upload-Length": 11
          }
        });

        req = jasmine.Ajax.requests.mostRecent();
        expect(req.url).toBe("http://tus.io/files/foo");
        expect(req.method).toBe("PATCH");

        req.respondWith({
          status: 204,
          responseHeaders: {
            "Upload-Offset": 5
          }
        });

        req = jasmine.Ajax.requests.mostRecent();
        expect(req.url).toBe("http://tus.io/files/foo");
        expect(req.method).toBe("PATCH");

        req.respondWith({
          status: 500
        });

        setTimeout(function () {
          req = jasmine.Ajax.requests.mostRecent();
          expect(req.url).toBe("http://tus.io/files/foo");
          expect(req.method).toBe("HEAD");

          req.respondWith({
            status: 204,
            responseHeaders: {
              "Upload-Offset": 5,
              "Upload-Length": 11
            }
          });

          req = jasmine.Ajax.requests.mostRecent();
          expect(req.url).toBe("http://tus.io/files/foo");
          expect(req.method).toBe("PATCH");

          req.respondWith({
            status: 204,
            responseHeaders: {
              "Upload-Offset": 11
            }
          });

          expect(options.onError).not.toHaveBeenCalled();
          expect(options.onSuccess).toHaveBeenCalled();
          done();
        }, 20);
      }, 20);
    });
  });
});
