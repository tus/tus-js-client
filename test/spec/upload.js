var isBrowser  = typeof window !== "undefined";
var isNode     = !isBrowser;

if (isNode) {
  // In the browser environment, Axios and tus are provided directly from
  // SpecRunner.html, but in Node we have to require them.
  var axios = require("axios");
  var tus = require("../../");
  var SynchronousPromise = require("synchronous-promise").SynchronousPromise;
}

var getBlob = function (str) {
  if (isNode) {
    return Buffer.from(str);
  } else {
    return new Blob(str.split(""));
  }
};

var getStorage = function () {
  // this storage is only needed for the node environment. It defaults to localStorage
  // for browser.
  if (isNode) {
    var temp = require("temp");
    var storagePath = temp.path();
    return new tus.FileStorage(storagePath);
  }

  return null;
};

// Set Jasmine's timeout for a single test to 20s
jasmine.DEFAULT_TIMEOUT_INTERVAL = 20 * 1000;

// NOTE: if a test case uses the 'waitTillNextReq' function,
// a unique request host (different from those in other test cases)
// must be specified in order to be able to uniquely identify the request being waited for.
describe("tus", function () {
  describe("#isSupported", function () {
    it("should be true", function () {
      expect(tus.isSupported).toBe(true);
    });
  });

  describe("#Upload", function () {
    beforeEach(function () {
      jasmine.Ajax.install();
      SynchronousPromise.installGlobally();

      // Clear localStorage before every test to prevent stored URLs to
      // interfere with our setup.
      if (isBrowser) {
        localStorage.clear();
      }
    });

    afterEach(function () {
      jasmine.Ajax.uninstall();
      SynchronousPromise.uninstallGlobally();
    });

    it("should throw if no error handler is available", function () {
      var upload = new tus.Upload(null);
      expect(upload.start.bind(upload)).toThrowError("tus: no file or stream to upload provided");
    });

    it("should throw if no endpoint and upload URL is provided", function () {
      var file = getBlob("hello world");
      var upload = new tus.Upload(file);
      expect(upload.start.bind(upload)).toThrowError("tus: neither an endpoint or an upload URL is provided");
    });

    it("should upload a file", function (done) {
      var file = getBlob("hello world");
      var host = "http://files.tus.io";
      var passedOptions;
      var passedFile;
      var options = {
        endpoint: host + "/uploads",
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
        urlStorage: getStorage(),
        onProgress: function () {},
        fingerprint: function (_file, _options, cb) {
          passedOptions = _options;
          passedFile = _file;
          cb(null, "fingerprinted");
        }
      };
      spyOn(options, "fingerprint").and.callThrough();
      spyOn(options, "onProgress");

      var upload = new tus.Upload(file, options);
      upload.start();

      expect(options.fingerprint).toHaveBeenCalled();
      expect(passedOptions).toBe(upload.options);
      expect(passedFile).toBe(file);

      waitTillNextReq(host, null, function (req) {
        expect(req.url).toBe(host + "/uploads");
        expect(req.method).toBe("POST");
        expect(req.requestHeaders.Custom).toBe("blargh");
        expect(req.requestHeaders["Tus-Resumable"]).toBe("1.0.0");
        expect(req.requestHeaders["Upload-Length"]).toBe(11);
        if (isBrowser) expect(req.withCredentials).toBe(true);
        expect(req.requestHeaders["Upload-Metadata"]).toBe("foo aGVsbG8=,bar d29ybGQ=,nonlatin c8WCb8WEY2U=,number MTAw");

        req.respondWith({
          status: 201,
          responseHeaders: {
            Location: host + "/uploads/blargh"
          }
        });

        expect(upload.url).toBe(host + "/uploads/blargh");

        req = jasmine.Ajax.requests.mostRecent();
        expect(req.url).toBe(host + "/uploads/blargh");
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
    });

    it("should create an upload if resuming fails", function (done) {
      var file = getBlob("hello world");
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

    it("should create an upload with the full data", function (done) {
      var file = getBlob("hello world");
      var options = {
        endpoint: "http://tus.io/uploads",
        uploadDataDuringCreation: true,
        onProgress: function () {},
        onChunkComplete: function () {},
        onSuccess: function () {}
      };

      spyOn(options, "onProgress");
      spyOn(options, "onChunkComplete");
      spyOn(options, "onSuccess");

      var upload = new tus.Upload(file, options);
      upload.start();

      var req = jasmine.Ajax.requests.mostRecent();
      expect(req.url).toBe("http://tus.io/uploads");
      expect(req.method).toBe("POST");
      expect(req.requestHeaders["Tus-Resumable"]).toBe("1.0.0");
      expect(req.requestHeaders["Upload-Length"]).toBe(11);
      expect(req.contentType()).toBe("application/offset+octet-stream");
      expect(req.params.size).toBe(11);

      req.respondWith({
        status: 201,
        responseHeaders: {
          Location: "http://tus.io/uploads/blargh",
          "Upload-Offset": 11
        }
      });


      expect(options.onProgress).toHaveBeenCalledWith(11, 11);
      expect(options.onChunkComplete).toHaveBeenCalledWith(11, 11, 11);
      expect(options.onSuccess).toHaveBeenCalled();

      expect(upload.url).toBe("http://tus.io/uploads/blargh");
      done();
    });

    it("should create an upload with partial data and continue", function (done) {
      var file = getBlob("hello world");
      var options = {
        endpoint: "http://tus.io/uploads",
        uploadDataDuringCreation: true,
        chunkSize: 6,
        onProgress: function () {},
        onChunkComplete: function () {},
        onSuccess: function () {}
      };

      spyOn(options, "onProgress");
      spyOn(options, "onChunkComplete");
      spyOn(options, "onSuccess");

      var upload = new tus.Upload(file, options);
      upload.start();

      var req = jasmine.Ajax.requests.mostRecent();
      expect(req.url).toBe("http://tus.io/uploads");
      expect(req.method).toBe("POST");
      expect(req.requestHeaders["Tus-Resumable"]).toBe("1.0.0");
      expect(req.requestHeaders["Upload-Length"]).toBe(11);
      expect(req.contentType()).toBe("application/offset+octet-stream");
      expect(req.params.size).toBe(6);

      req.respondWith({
        status: 201,
        responseHeaders: {
          Location: "http://tus.io/uploads/blargh",
          "Upload-Offset": 6
        }
      });


      expect(options.onProgress).toHaveBeenCalledWith(6, 11);
      expect(options.onChunkComplete).toHaveBeenCalledWith(6, 6, 11);
      expect(options.onSuccess).not.toHaveBeenCalled();

      expect(upload.url).toBe("http://tus.io/uploads/blargh");

      req = jasmine.Ajax.requests.mostRecent();
      expect(req.url).toBe("http://tus.io/uploads/blargh");
      expect(req.method).toBe("PATCH");
      expect(req.requestHeaders["Tus-Resumable"]).toBe("1.0.0");
      expect(req.requestHeaders["Upload-Offset"]).toBe(6);
      expect(req.contentType()).toBe("application/offset+octet-stream");
      expect(req.params.size).toBe(5);

      req.respondWith({
        status: 201,
        responseHeaders: {
          Location: "http://tus.io/uploads/blargh",
          "Upload-Offset": 11
        }
      });


      expect(options.onProgress).toHaveBeenCalledWith(11, 11);
      expect(options.onChunkComplete).toHaveBeenCalledWith(5, 11, 11);
      expect(options.onSuccess).toHaveBeenCalled();
      done();
    });

    it("should add the request's body to errors", function () {
      var file = getBlob("hello world");
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
        responseText: "server_error"
      });

      expect(err.message).toBe("tus: unexpected response while creating upload, originated from request (response code: 500, response text: server_error)");
      expect(err.originalRequest).toBeDefined();
    });

    it("should throw an error if resuming fails and no endpoint is provided", function (done) {
      var file = getBlob("hello world");
      var options = {
        uploadUrl: "http://tus.io/uploads/resuming",
        onError: function () {}
      };
      spyOn(options, "onError");

      var upload = new tus.Upload(file, options);
      upload.start();

      var req = jasmine.Ajax.requests.mostRecent();
      expect(req.url).toBe("http://tus.io/uploads/resuming");
      expect(req.method).toBe("HEAD");
      expect(req.requestHeaders["Tus-Resumable"]).toBe("1.0.0");

      req.respondWith({
        status: 404
      });

      expect(options.onError).toHaveBeenCalledWith(new Error("tus: unable to resume upload (new upload cannot be created without an endpoint), originated from request (response code: 404, response text: )"));
      done();
    });

    it("should resolve relative URLs", function (done) {
      var file = getBlob("hello world");
      var host = "http://relative.tus.io:1080";
      var options = {
        endpoint: host + "/files/"
      };

      var upload = new tus.Upload(file, options);
      upload.start();

      waitTillNextReq(host, null, function (req) {
        expect(req.url).toBe(host + "/files/");
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
        done();
      });
    });

    it("should upload a file in chunks", function (done) {
      var host = "http://chunks.tus.io";
      var file = getBlob("hello world");
      var passedOptions;
      var passedFile;
      var options = {
        endpoint: host + "/uploads",
        chunkSize: 7,
        urlStorage: getStorage(),
        onProgress: function () {},
        onChunkComplete: function () {},
        fingerprint: function (_file, _options, cb) {
          passedOptions = _options;
          passedFile = _file;
          cb(null, "fingerprinted");
        }
      };
      spyOn(options, "fingerprint").and.callThrough();
      spyOn(options, "onProgress");
      spyOn(options, "onChunkComplete");

      var upload = new tus.Upload(file, options);
      upload.start();

      expect(options.fingerprint).toHaveBeenCalled();
      expect(passedOptions).toBe(upload.options);
      expect(passedFile).toBe(file);

      waitTillNextReq(host, null, function (req) {
        expect(req.url).toBe(host + "/uploads");
        expect(req.method).toBe("POST");
        expect(req.requestHeaders["Tus-Resumable"]).toBe("1.0.0");
        expect(req.requestHeaders["Upload-Length"]).toBe(11);

        req.respondWith({
          status: 201,
          responseHeaders: {
            Location: "/uploads/blargh"
          }
        });

        expect(upload.url).toBe(host + "/uploads/blargh");

        req = jasmine.Ajax.requests.mostRecent();
        expect(req.url).toBe(host + "/uploads/blargh");
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
        expect(req.url).toBe(host + "/uploads/blargh");
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
    });

    it("should add the original request to errors", function (done) {
      var file = getBlob("hello world");
      var host = "http://original.tus.io";
      var err;
      var options = {
        endpoint: host + "/uploads",
        onError: function (e) {
          err = e;
        }
      };

      var upload = new tus.Upload(file, options);
      upload.start();

      waitTillNextReq(host, null, function (req) {
        expect(req.url).toBe(host + "/uploads");
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
        done();
      });
    });

    it("should only create an upload for empty files", function (done) {
      var file = getBlob("");
      var host = "http://empty.tus.io";
      var options = {
        endpoint: host + "/uploads",
        onSuccess: function () {}
      };
      spyOn(options, "onSuccess");

      var upload = new tus.Upload(file, options);
      upload.start();

      waitTillNextReq(host, null, function (req) {
        expect(req.url).toBe(host + "/uploads");
        expect(req.method).toBe("POST");
        expect(req.requestHeaders["Tus-Resumable"]).toBe("1.0.0");
        expect(req.requestHeaders["Upload-Length"]).toBe(0);

        req.respondWith({
          status: 201,
          responseHeaders: {
            "Location": host + "/uploads/empty"
          }
        });

        expect(options.onSuccess).toHaveBeenCalled();
        done();
      });
    });

    it("should not resume a finished upload", function (done) {
      var file = getBlob("hello world");
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
      var file = getBlob("hello world");
      var options = {
        endpoint: "http://tus.io/uploads",
        uploadUrl: "http://tus.io/files/upload",
        onProgress: function () {},
        fingerprint: function (_, __, cb) {cb(null, "fingerprinted");}
      };
      spyOn(options, "fingerprint").and.callThrough();
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
      var file = getBlob("hello world");
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
      var file = getBlob("hello world");
      var host = "http://override.tus.io";
      var options = {
        endpoint: host + "/uploads",
        uploadUrl: host + "/files/upload",
        overridePatchMethod: true
      };

      var upload = new tus.Upload(file, options);
      upload.start();

      waitTillNextReq(host, null, function (req) {
        expect(req.url).toBe(host + "/files/upload");
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
        expect(req.url).toBe(host + "/files/upload");
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
    });

    it("should emit an error if an upload is locked", function (done) {
      var file = getBlob("hello world");
      var host = "http://locked.tus.io";
      var options = {
        endpoint: host + "/uploads",
        uploadUrl: host + "/files/upload",
        onError: function () {}
      };

      spyOn(options, "onError");

      var upload = new tus.Upload(file, options);
      upload.start();

      waitTillNextReq(host, null, function (req) {
        expect(req.url).toBe(host + "/files/upload");
        expect(req.method).toBe("HEAD");

        req.respondWith({
          status: 423 // Locked
        });

        expect(options.onError).toHaveBeenCalledWith(new Error("tus: upload is currently locked; retry later, originated from request (response code: 423, response text: )"));
        done();
      });
    });

    it("should emit an error if no Location header is presented", function (done) {
      var file = getBlob("hello world");
      var host = "http://emit.tus.io";
      var options = {
        endpoint: host + "/uploads",
        onError: function () {}
      };

      spyOn(options, "onError");

      var upload = new tus.Upload(file, options);
      upload.start();

      waitTillNextReq(host, null, function (req) {
        expect(req.url).toBe(host + "/uploads");
        expect(req.method).toBe("POST");
        // The Location header is omitted on purpose here

        req.respondWith({
          status: 201
        });

        expect(options.onError).toHaveBeenCalledWith(new Error("tus: invalid or missing Location header, originated from request (response code: 201, response text: )"));
        done();
      });
    });

    it("should throw if retryDelays is not an array", function () {
      var file = getBlob("hello world");
      var upload = new tus.Upload(file, {
        endpoint: "http://endpoint/",
        retryDelays: 44
      });
      expect(upload.start.bind(upload)).toThrowError("tus: the `retryDelays` option must either be an array or null");
    });

    // This tests ensures that tus-js-client correctly retries if the
    // response has the code 500 Internal Error, 423 Locked or 409 Conflict.
    it("should retry the upload", function (done) {
      var file = getBlob("hello world");
      var host = "http://retry.tus.io";
      var options = {
        endpoint: host + "/files/",
        retryDelays: [10, 10, 10],
        onSuccess: function () {}
      };

      spyOn(options, "onSuccess");

      var upload = new tus.Upload(file, options);
      upload.start();

      waitTillNextReq(host, null, function (req) {
        expect(req.url).toBe(host + "/files/");
        expect(req.method).toBe("POST");

        req.respondWith({
          status: 500
        });

        setTimeout(function () {
          req = jasmine.Ajax.requests.mostRecent();
          expect(req.url).toBe(host + "/files/");
          expect(req.method).toBe("POST");

          req.respondWith({
            status: 201,
            responseHeaders: {
              Location: "/files/foo"
            }
          });

          req = jasmine.Ajax.requests.mostRecent();
          expect(req.url).toBe(host + "/files/foo");
          expect(req.method).toBe("PATCH");

          req.respondWith({
            status: 423
          });

          setTimeout(function () {
            req = jasmine.Ajax.requests.mostRecent();
            expect(req.url).toBe(host + "/files/foo");
            expect(req.method).toBe("HEAD");

            req.respondWith({
              status: 201,
              responseHeaders: {
                "Upload-Offset": 0,
                "Upload-Length": 11
              }
            });

            req = jasmine.Ajax.requests.mostRecent();
            expect(req.url).toBe(host + "/files/foo");
            expect(req.method).toBe("PATCH");

            req.respondWith({
              status: 409
            });

            setTimeout(function () {
              req = jasmine.Ajax.requests.mostRecent();
              expect(req.url).toBe(host + "/files/foo");
              expect(req.method).toBe("HEAD");

              req.respondWith({
                status: 201,
                responseHeaders: {
                  "Upload-Offset": 0,
                  "Upload-Length": 11
                }
              });

              req = jasmine.Ajax.requests.mostRecent();
              expect(req.url).toBe(host + "/files/foo");
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
          }, 20);
        }, 20);
      });
    });

    it("should not retry if the error has not been caused by a request", function (done) {
      var file = getBlob("hello world");
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

      setTimeout(function () {
        var error = new Error("custom error");
        upload._emitError(error);

        expect(upload._createUpload).toHaveBeenCalledTimes(1);
        expect(options.onError).toHaveBeenCalledWith(error);
        expect(options.onSuccess).not.toHaveBeenCalled();
        done();
      }, 200);
    });

    it("should stop retrying after all delays have been used", function (done) {
      var file = getBlob("hello world");
      var host = "http://delays.tus.io";
      var options = {
        endpoint: host + "/files/",
        retryDelays: [10],
        onSuccess: function () {},
        onError: function () {}
      };

      spyOn(options, "onSuccess");
      spyOn(options, "onError");

      var upload = new tus.Upload(file, options);
      upload.start();

      waitTillNextReq(host, null, function (req) {
        expect(req.url).toBe(host + "/files/");
        expect(req.method).toBe("POST");

        req.respondWith({
          status: 500
        });

        setTimeout(function () {
          expect(options.onError).not.toHaveBeenCalled();

          var req = jasmine.Ajax.requests.mostRecent();
          expect(req.url).toBe(host + "/files/");
          expect(req.method).toBe("POST");

          req.respondWith({
            status: 500
          });

          expect(options.onSuccess).not.toHaveBeenCalled();
          expect(options.onError).toHaveBeenCalledTimes(1);
          done();
        }, 200);
      });
    });

    it("should stop retrying when the abort function is called", function (done) {
      var file = getBlob("hello world");
      var host = "http://noretry.tus.io";
      var options = {
        endpoint: host + "/files/",
        retryDelays: [100],
        onError: function () {}
      };

      spyOn(options, "onError");

      var upload = new tus.Upload(file, options);
      upload.start();

      waitTillNextReq(host, null, function (req) {
        expect(req.url).toBe(host + "/files/");
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
    });

    it("should stop upload when the abort function is called during a callback", function (done) {
      var upload;
      var host = "http://abort2.tus.io";
      var file = getBlob("hello world");
      var options = {
        endpoint: host + "/files/",
        chunkSize: 5,
        onChunkComplete: function () {
          upload.abort();
        }
      };

      spyOn(options, "onChunkComplete").and.callThrough();

      upload = new tus.Upload(file, options);
      upload.start();

      waitTillNextReq(host, null, function (req) {
        expect(req.url).toBe(host + "/files/");
        expect(req.method).toBe("POST");

        req.respondWith({
          status: 201,
          responseHeaders: {
            Location: "/files/foo"
          }
        });

        req = jasmine.Ajax.requests.mostRecent();
        expect(req.url).toBe(host + "/files/foo");
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
    });

    it("should terminate upload when abort is called with true", function (done) {
      var upload;
      var host = "http://abort2.tus.io";
      var file = getBlob("hello world");
      var callbackTriggered = false;
      var options = {
        endpoint: host + "/files/",
        chunkSize: 5,
        onChunkComplete: function () {
          upload.abort(true, function () {
            callbackTriggered = true;
          });
        }
      };

      spyOn(options, "onChunkComplete").and.callThrough();

      upload = new tus.Upload(file, options);
      upload.start();

      waitTillNextReq(host, null, function (req) {
        expect(req.url).toBe(host + "/files/");
        expect(req.method).toBe("POST");

        req.respondWith({
          status: 201,
          responseHeaders: {
            Location: "/files/foo"
          }
        });

        req = jasmine.Ajax.requests.mostRecent();
        expect(req.url).toBe(host + "/files/foo");
        expect(req.method).toBe("PATCH");

        req.respondWith({
          status: 204,
          responseHeaders: {
            "Upload-Offset": 5
          }
        });

        setTimeout(function () {
          expect(options.onChunkComplete).toHaveBeenCalled();

          req = jasmine.Ajax.requests.mostRecent();
          expect(req.url).toBe(host + "/files/foo");
          expect(req.method).toBe("DELETE");
          req.respondWith({status: 204});

          expect(callbackTriggered).toBe(true);
          done();
        }, 200);
      });
    });

    it("should stop upload when the abort function is called during the POST request", function (done) {
      var file = getBlob("hello world");
      var host = "http://abort.tus.io";
      var options = {
        endpoint: host + "/files/",
        onError: function () {}
      };

      spyOn(options, "onError");

      var upload = new tus.Upload(file, options);
      upload.start();

      upload.abort();

      waitTillNextReq(host, null, function (req) {
        expect(req.url).toBe(host + "/files/");
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
    });

    it("should reset the attempt counter if an upload proceeds", function (done) {
      var file = getBlob("hello world");
      var host = "http://reset.tus.io";
      var options = {
        endpoint: host + "/files/",
        retryDelays: [10],
        onError: function () {},
        onSuccess: function () {}
      };

      spyOn(options, "onError");
      spyOn(options, "onSuccess");

      var upload = new tus.Upload(file, options);
      upload.start();

      waitTillNextReq(host, null, function (req) {
        expect(req.url).toBe(host + "/files/");
        expect(req.method).toBe("POST");

        req.respondWith({
          status: 201,
          responseHeaders: {
            Location: "/files/foo"
          }
        });

        req = jasmine.Ajax.requests.mostRecent();
        expect(req.url).toBe(host + "/files/foo");
        expect(req.method).toBe("PATCH");

        req.respondWith({
          status: 500
        });

        setTimeout(function () {
          req = jasmine.Ajax.requests.mostRecent();
          expect(req.url).toBe(host + "/files/foo");
          expect(req.method).toBe("HEAD");

          req.respondWith({
            status: 204,
            responseHeaders: {
              "Upload-Offset": 0,
              "Upload-Length": 11
            }
          });

          req = jasmine.Ajax.requests.mostRecent();
          expect(req.url).toBe(host + "/files/foo");
          expect(req.method).toBe("PATCH");

          req.respondWith({
            status: 204,
            responseHeaders: {
              "Upload-Offset": 5
            }
          });

          waitTillNextReq(host, req, function (req) {
            expect(req.url).toBe(host + "/files/foo");
            expect(req.method).toBe("PATCH");

            req.respondWith({
              status: 500
            });

            setTimeout(function () {
              req = jasmine.Ajax.requests.mostRecent();
              expect(req.url).toBe(host + "/files/foo");
              expect(req.method).toBe("HEAD");

              req.respondWith({
                status: 204,
                responseHeaders: {
                  "Upload-Offset": 5,
                  "Upload-Length": 11
                }
              });

              req = jasmine.Ajax.requests.mostRecent();
              expect(req.url).toBe(host + "/files/foo");
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
          });
        }, 20);
      });
    });
  });

  it("should upload to a real tus server", function (done) {
    var file = getBlob("hello world");
    var options = {
      resume: false,
      endpoint: "https://master.tus.io/files/",
      metadata: {
        nonlatin: "słońce",
        number: 100,
        filename: "hello.txt",
        filetype: "text/plain"
      },
      onSuccess: function () {
        expect(upload.url).toMatch(/^https:\/\/master\.tus\.io\/files\//);
        console.log("Upload URL:", upload.url); // eslint-disable-line no-console

        validateUploadContent(upload, function (err) {
          if (err) {
            done.fail(err);
            return;
          }

          // delete the upload after it was completed
          upload.abort(true, function (err) {
            if (err) {
              done.fail(err);
              return;
            }

            validateUploadDeletion(upload, done);
          });
        });
      },
      onError: function (err) {
        done.fail(err);
      }
    };

    var upload = new tus.Upload(file, options);
    upload.start();
  });

  it("should upload to a real tus server with creation-with-upload", function (done) {
    var file = getBlob("hello world");
    var options = {
      resume: false,
      endpoint: "https://master.tus.io/files/",
      uploadDataDuringCreation: true,
      metadata: {
        nonlatin: "słońce",
        number: 100,
        filename: "hello.txt",
        filetype: "text/plain"
      },
      onSuccess: function () {
        expect(upload.url).toMatch(/^https:\/\/master\.tus\.io\/files\//);
        console.log("Upload URL:", upload.url); // eslint-disable-line no-console

        validateUploadContent(upload, done);
      },
      onError: function (err) {
        done.fail(err);
      }
    };

    var upload = new tus.Upload(file, options);
    upload.start();
  });
});

function validateUploadContent(upload, cb) {
  axios.get(upload.url)
    .then(function (res) {
      expect(res.status).toBe(200);
      expect(res.data).toBe("hello world");

      validateUploadMetadata(upload, cb);
    })
    .catch(cb);
}

function validateUploadMetadata(upload, cb) {
  axios.head(upload.url, {
    headers: {
      "Tus-Resumable": "1.0.0"
    }
  }).then(function (res) {
    expect(res.status).toBe(200);
    expect(res.data).toBe("");
    expect(res.headers["tus-resumable"]).toBe("1.0.0");
    expect(res.headers["upload-offset"]).toBe("11");
    expect(res.headers["upload-length"]).toBe("11");

    // The values in the Upload-Metadata header may not be in^the same
    // order as we submitted them (the specification does not require
    // that). Therefore, we split the values and verify that each one
    // is present.
    var metadataStr = res.headers["upload-metadata"];
    expect(metadataStr).toBeTruthy();
    var metadata = metadataStr.split(",");
    expect(metadata).toContain("filename aGVsbG8udHh0");
    expect(metadata).toContain("filetype dGV4dC9wbGFpbg==");
    expect(metadata).toContain("nonlatin c8WCb8WEY2U=");
    expect(metadata).toContain("number MTAw");
    expect(metadata.length).toBe(4);

    cb();
  })
    .catch(cb);
}

function validateUploadDeletion(upload, done) {
  var validateStatus = function (status) {
    return status === 404;
  };

  axios.get(upload.url, { validateStatus: validateStatus })
    .then(function (res) {
      expect(res.status).toBe(404);
      done();
    })
    .catch(done.fail);
}

function waitTillNextReq(id, req, cb, level) {
  var allowedLevels = 5;
  level = level || 0;
  if (level >= allowedLevels) {
    fail(new Error("call level exceeded"));
    return;
  }
  setTimeout(function () {
    var newReq = jasmine.Ajax.requests.mostRecent();
    if (!req || (req && newReq != req)) {
      if (newReq && newReq.url.indexOf(id) === 0) {
        return cb(newReq);
      }
    }

    waitTillNextReq(id, req, cb, level + 1);
  }, 20);
}