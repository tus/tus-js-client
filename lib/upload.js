/* global window */
import DetailedError from "./error";
import uuid from "./uuid";
import extend from "extend";
import { Base64 } from "js-base64";
import URL from "url-parse";

const defaultOptions = {
  endpoint: null,

  uploadUrl: null,
  metadata: {},
  fingerprint: null,
  uploadSize: null,

  onProgress: null,
  onChunkComplete: null,
  onSuccess: null,
  onError: null,

  overridePatchMethod: false,
  headers: {},
  addRequestId: false,

  chunkSize: Infinity,
  retryDelays: null,
  storeFingerprintForResuming: true,
  removeFingerprintOnSuccess: false,
  uploadLengthDeferred: false,
  uploadDataDuringCreation: false,

  urlStorage: null,
  fileReader: null,
  httpStack: null
};

class BaseUpload {
  constructor(file, options) {
    // TODO: Add warning if resume option is passed
    // TODO: Freeze options
    this.options = extend(true, {}, defaultOptions, options);

    // The storage module used to store URLs
    this._urlStorage = this.options.urlStorage;

    // The underlying File/Blob object
    this.file = file;

    // The URL against which the file will be uploaded
    this.url = null;

    // The underlying request object for the current PATCH request
    this._req = null;

    // The fingerpinrt for the current file (set after start())
    this._fingerprint = null;

    this._urlStorageKey = null;

    // The offset used in the current PATCH request
    this._offset = null;

    // True if the current PATCH request has been aborted
    this._aborted = false;

    // The file's size in bytes
    this._size = null;

    // The Source object which will wrap around the given file and provides us
    // with a unified interface for getting its size and slice chunks from its
    // content allowing us to easily handle Files, Blobs, Buffers and Streams.
    this._source = null;

    // The current count of attempts which have been made. Null indicates none.
    this._retryAttempt = 0;

    // The timeout's ID which is used to delay the next retry
    this._retryTimeout = null;

    // The offset of the remote upload before the latest attempt was started.
    this._offsetBeforeRetry = 0;
  }

  static terminate(url, options, cb) {
    if (typeof options !== "function" && typeof cb !== "function") {
      throw new Error("tus: a callback function must be specified");
    }

    if (typeof options === "function") {
      cb = options;
      options = {};
    }

    let retryAttempt = 0;
    const retryIfShould = (err) => {
      if (shouldRetry(err, retryAttempt, options)) {
        const delay = options.retryDelays[retryAttempt++];
        setTimeout(() => BaseUpload.terminate(url, options, cb), delay);
      } else {
        cb(err);
      }
    };

    const req = openRequest("DELETE", url, options);
    const promise = req.send();

    promise.then((res) => {
      if (res.getStatus() !== 204) {
        retryIfShould(new DetailedError("tus: unexpected response while terminating upload", null, req, res));
        return;
      }

      cb();
    }).catch((err) => {
      retryIfShould(new DetailedError("tus: failed to terminate upload", err, req, null));
    });
  }

  findPreviousUploads() {
    return this.options.fingerprint(this.file, this.options)
      .then((fingerprint) => this._urlStorage.findUploadsByFingerprint(fingerprint));
  }

  resumeFromPreviousUpload(previousUpload) {
    this.url = previousUpload.uploadUrl;
    this._urlStorageKey = previousUpload.urlStorageKey;
  }

  start() {
    let file = this.file;

    if (!file) {
      this._emitError(new Error("tus: no file or stream to upload provided"));
      return;
    }

    if (!this.options.endpoint && !this.options.uploadUrl) {
      this._emitError(new Error("tus: neither an endpoint or an upload URL is provided"));
      return;
    }

    // TODO: Move to _emitError
    let retryDelays = this.options.retryDelays;
    if (retryDelays != null) {
      if (Object.prototype.toString.call(retryDelays) !== "[object Array]") {
        this._emitError(new Error("tus: the `retryDelays` option must either be an array or null"));
        return;
      } else {
        let errorCallback = this.options.onError;
        this.options.onError = (err) => {
          // Restore the original error callback which may have been set.
          this.options.onError = errorCallback;

          // We will reset the attempt counter if
          // - we were already able to connect to the server (offset != null) and
          // - we were able to upload a small chunk of data to the server
          let shouldResetDelays = this._offset != null && (this._offset > this._offsetBeforeRetry);
          if (shouldResetDelays) {
            this._retryAttempt = 0;
          }

          if (!shouldRetry(err, this._retryAttempt, this.options)) {
            this._emitError(err);
            return;
          }

          let delay = retryDelays[this._retryAttempt++];

          this._offsetBeforeRetry = this._offset;
          this.options.uploadUrl = this.url;

          this._retryTimeout = setTimeout(() => {
            this.start();
          }, delay);
        };
      }
    }

    this.options.fingerprint(file, this.options)
      .then((fingerprint) => {
        // TODO: Warn if no fingerprint is being provided
        this._fingerprint = fingerprint;

        if (this._source) {
          return this._source;
        } else {
          return this.options.fileReader.openFile(file, this.options.chunkSize);
        }
      })
      .then((source) => {
        this._source = source;
        this._start(source);
      })
      .catch((err) => {
        this._emitError(err);
      });
  }

  _start(source) {
    // First, we look at the uploadLengthDeferred option.
    // Next, we check if the caller has supplied a manual upload size.
    // Finally, we try to use the calculated size from the source object.
    if (this.options.uploadLengthDeferred) {
      this._size = null;
    } else if (this.options.uploadSize != null) {
      this._size = +this.options.uploadSize;
      if (isNaN(this._size)) {
        this._emitError(new Error("tus: cannot convert `uploadSize` option into a number"));
        return;
      }
    } else {
      this._size = source.size;
      if (this._size == null) {
        this._emitError(new Error("tus: cannot automatically derive upload's size from input and must be specified manually using the `uploadSize` option"));
        return;
      }
    }

    // Reset the aborted flag when the upload is started or else the
    // _startUpload will stop before sending a request if the upload has been
    // aborted previously.
    this._aborted = false;

    // The upload had been started previously and we should reuse this URL.
    if (this.url != null) {
      this._resumeUpload();
      return;
    }

    // A URL has manually been specified, so we try to resume
    if (this.options.uploadUrl != null) {
      this.url = this.options.uploadUrl;
      this._resumeUpload();
      return;
    }

    // An upload has not started for the file yet, so we start a new one
    this._createUpload();
  }

  // TODO: Move to promises
  abort(shouldTerminate, cb = () => {}) {
    if (this._req !== null) {
      this._req.abort();
      this._source.close();
    }
    this._aborted = true;

    if (this._retryTimeout != null) {
      clearTimeout(this._retryTimeout);
      this._retryTimeout = null;
    }

    if (!shouldTerminate || this.url == null) {
      return cb();
    }

    BaseUpload.terminate(this.url, this.options, (err) => {
      if (err) {
        return cb(err);
      }

      // Remove entry from the URL storage since the upload URL is no longer valid.
      this._removeFromUrlStorage();

      cb();
    });
  }

  _emitHttpError(req, res, message, causingErr) {
    this._emitError(new DetailedError(message, causingErr, req, res));
  }

  _emitError(err) {
    // Do not emit errors, e.g. from aborted HTTP requests, if the upload has been stopped.
    if (this._aborted) return;

    if (typeof this.options.onError === "function") {
      this.options.onError(err);
    } else {
      throw err;
    }
  }

  _emitSuccess() {
    if (typeof this.options.onSuccess === "function") {
      this.options.onSuccess();
    }
  }

  /**
   * Publishes notification when data has been sent to the server. This
   * data may not have been accepted by the server yet.
   * @param  {number} bytesSent  Number of bytes sent to the server.
   * @param  {number} bytesTotal Total number of bytes to be sent to the server.
   */
  _emitProgress(bytesSent, bytesTotal) {
    if (typeof this.options.onProgress === "function") {
      this.options.onProgress(bytesSent, bytesTotal);
    }
  }

  /**
   * Publishes notification when a chunk of data has been sent to the server
   * and accepted by the server.
   * @param  {number} chunkSize  Size of the chunk that was accepted by the
   *                             server.
   * @param  {number} bytesAccepted Total number of bytes that have been
   *                                accepted by the server.
   * @param  {number} bytesTotal Total number of bytes to be sent to the server.
   */
  _emitChunkComplete(chunkSize, bytesAccepted, bytesTotal) {
    if (typeof this.options.onChunkComplete === "function") {
      this.options.onChunkComplete(chunkSize, bytesAccepted, bytesTotal);
    }
  }

  /**
   * Create a new upload using the creation extension by sending a POST
   * request to the endpoint. After successful creation the file will be
   * uploaded
   *
   * @api private
   */
  _createUpload() {
    if (!this.options.endpoint) {
      this._emitError(new Error("tus: unable to create upload because no endpoint is provided"));
      return;
    }

    let req = this._openRequest("POST", this.options.endpoint);

    if (this.options.uploadLengthDeferred) {
      req.setHeader("Upload-Defer-Length", 1);
    } else {
      req.setHeader("Upload-Length", this._size);
    }

    // Add metadata if values have been added
    var metadata = encodeMetadata(this.options.metadata);
    if (metadata !== "") {
      req.setHeader("Upload-Metadata", metadata);
    }

    let promise;
    if (this.options.uploadDataDuringCreation && !this.options.uploadLengthDeferred) {
      this._offset = 0;
      promise = this._addChunkToRequest(req);
    } else {
      promise = req.send(null);
    }

    promise.then((res) => {
      if (!inStatusCategory(res.getStatus(), 200)) {
        this._emitHttpError(req, res, "tus: unexpected response while creating upload");
        return;
      }

      const location = res.getHeader("Location");
      if (location == null) {
        this._emitHttpError(req, res, "tus: invalid or missing Location header");
        return;
      }

      this.url = resolveUrl(this.options.endpoint, location);

      if (this._size === 0) {
        // Nothing to upload and file was successfully created
        this._emitSuccess();
        this._source.close();
        return;
      }

      // TODO
      if (this.options.storeFingerprintForResuming && this._fingerprint) {
        const storedUpload = {
          uploadUrl: this.url,
          size: this._size,
          metadata: this.options.metadata,
          creationTime: new Date().toString()
        };

        this._urlStorage.addUpload(this._fingerprint, storedUpload)
          .then((urlStorageKey) => this._urlStorageKey = urlStorageKey)
          .catch((err) => {
            this._emitError(err);
          });
      }

      if (this.options.uploadDataDuringCreation) {
        this._handleUploadResponse(req, res);
      } else {
        this._offset = 0;
        this._startUpload();
      }
    }).catch((err) => {
      this._emitHttpError(req, null, "tus: failed to create upload", err);
    });
  }

  /*
   * Try to resume an existing upload. First a HEAD request will be sent
   * to retrieve the offset. If the request fails a new upload will be
   * created. In the case of a successful response the file will be uploaded.
   *
   * @api private
   */
  _resumeUpload() {
    const req = this._openRequest("HEAD", this.url);
    const promise = req.send(null);

    promise.then((res) => {
      const status = res.getStatus();
      if (!inStatusCategory(status, 200)) {
        if (inStatusCategory(status, 400)) {
          // Remove stored fingerprint and corresponding endpoint,
          // on client errors since the file can not be found
          this._removeFromUrlStorage();
        }

        // If the upload is locked (indicated by the 423 Locked status code), we
        // emit an error instead of directly starting a new upload. This way the
        // retry logic can catch the error and will retry the upload. An upload
        // is usually locked for a short period of time and will be available
        // afterwards.
        if (status === 423) {
          this._emitHttpError(req, res, "tus: upload is currently locked; retry later");
          return;
        }

        if (!this.options.endpoint) {
          // Don't attempt to create a new upload if no endpoint is provided.
          this._emitHttpError(req, res, "tus: unable to resume upload (new upload cannot be created without an endpoint)");
          return;
        }

        // Try to create a new upload
        this.url = null;
        this._createUpload();
        return;
      }

      let offset = parseInt(res.getHeader("Upload-Offset"), 10);
      if (isNaN(offset)) {
        this._emitHttpError(req, res, "tus: invalid or missing offset value");
        return;
      }

      let length = parseInt(res.getHeader("Upload-Length"), 10);
      if (isNaN(length) && !this.options.uploadLengthDeferred) {
        this._emitHttpError(req, res, "tus: invalid or missing length value");
        return;
      }

      // Upload has already been completed and we do not need to send additional
      // data to the server
      if (offset === length) {
        this._emitProgress(length, length);
        this._emitSuccess();
        return;
      }

      this._offset = offset;
      this._startUpload();
    }).catch((err) => {
      this._emitHttpError(req, null, "tus: failed to resume upload", err);
    });

  }

  /**
   * Start uploading the file using PATCH requests. The file will be divided
   * into chunks as specified in the chunkSize option. During the upload
   * the onProgress event handler may be invoked multiple times.
   *
   * @api private
   */
  _startUpload() {
    // If the upload has been aborted, we will not send the next PATCH request.
    // This is important if the abort method was called during a callback, such
    // as onChunkComplete or onProgress.
    if (this._aborted) {
      return;
    }

    let req;

    // Some browser and servers may not support the PATCH method. For those
    // cases, you can tell tus-js-client to use a POST request with the
    // X-HTTP-Method-Override header for simulating a PATCH request.
    if (this.options.overridePatchMethod) {
      req = this._openRequest("POST", this.url);
      req.setHeader("X-HTTP-Method-Override", "PATCH");
    } else {
      req = this._openRequest("PATCH", this.url);
    }

    req.setHeader("Upload-Offset", this._offset);
    const promise = this._addChunkToRequest(req);

    promise.then((res) => {
      if (!inStatusCategory(res.getStatus(), 200)) {
        this._emitHttpError(req, res, "tus: unexpected response while uploading chunk");
        return;
      }

      this._handleUploadResponse(req, res);
    }).catch((err) => {
      // Don't emit an error if the upload was aborted manually
      if (this._aborted) {
        return;
      }

      this._emitHttpError(req, null, "tus: failed to upload chunk at offset " + this._offset, err);
    });
  }

  /**
   * _addChunktoRequest reads a chunk from the source and sends it using the
   * supplied request object. It will not handle the response.
   */
  _addChunkToRequest(req) {
    let start = this._offset;
    let end = this._offset + this.options.chunkSize;

    req.setProgressHandler((bytesSent) => {
      this._emitProgress(start + bytesSent, this._size);
    });

    req.setHeader("Content-Type", "application/offset+octet-stream");

    // The specified chunkSize may be Infinity or the calcluated end position
    // may exceed the file's size. In both cases, we limit the end position to
    // the input's total size for simpler calculations and correctness.
    if ((end === Infinity || end > this._size) && !this.options.uploadLengthDeferred) {
      end = this._size;
    }

    return this._source.slice(start, end)
      .then(({ value, done }) => {
        // If the upload length is deferred, the upload size was not specified during
        // upload creation. So, if the file reader is done reading, we know the total
        // upload size and can tell the tus server.
        if (this.options.uploadLengthDeferred && done) {
          this._size = this._offset + (value && value.size ? value.size : 0);
          req.setHeader("Upload-Length", this._size);
        }

        if (value === null) {
          return req.send();
        } else {
          this._emitProgress(this._offset, this._size);
          return req.send(value);
        }
      });
  }

  /**
   * _handleUploadResponse is used by requests that haven been sent using _addChunkToRequest
   * and already have received a response.
   */
  _handleUploadResponse(req, res) {
    let offset = parseInt(res.getHeader("Upload-Offset"), 10);
    if (isNaN(offset)) {
      this._emitHttpError(req, res, "tus: invalid or missing offset value");
      return;
    }

    this._emitProgress(offset, this._size);
    this._emitChunkComplete(offset - this._offset, offset, this._size);

    this._offset = offset;

    if (offset == this._size) {
      if (this.options.removeFingerprintOnSuccess) {
        // Remove stored fingerprint and corresponding endpoint. This causes
        // new upload of the same file must be treated as a different file.
        this._removeFromUrlStorage();
      }

      // Yay, finally done :)
      this._emitSuccess();
      this._source.close();
      return;
    }

    this._startUpload();
  }

  /**
   *  Create a new HTTP request object with the given method and URL.
   *
   * @api private
   */
  _openRequest(method, url) {
    const req = openRequest(method, url, this.options);
    this._req = req;
    return req;
  }

  _removeFromUrlStorage() {
    if (!this._urlStorageKey) return;

    this._urlStorage.removeUpload(this._urlStorageKey).catch((err) => {
      this._emitError(err);
    });
    this._urlStorageKey = null;
  }
}

function encodeMetadata(metadata) {
  var encoded = [];

  for (var key in metadata) {
    encoded.push(key + " " + Base64.encode(metadata[key]));
  }

  return encoded.join(",");
}

/**
 * Checks whether a given status is in the range of the expected category.
 * For example, only a status between 200 and 299 will satisfy the category 200.
 *
 * @api private
 */
function inStatusCategory(status, category) {
  return (status >= category && status < (category + 100));
}

function openRequest(method, url, options) {
  const req = options.httpStack.createRequest(method, url);

  req.setHeader("Tus-Resumable", "1.0.0");
  let headers = options.headers || {};

  for (let name in headers) {
    req.setHeader(name, headers[name]);
  }

  if (options.addRequestId) {
    const requestId =  uuid();
    req.setHeader("X-Request-ID", requestId);
  }

  return req;
}

/**
 * Checks whether the browser running this code has internet access.
 * This function will always return true in the node.js environment
 *
 * @api private
 */
function isOnline() {
  let online = true;
  if (typeof window !== "undefined" &&
        "navigator" in window &&
        window.navigator.onLine === false) {
    online = false;
  }

  return online;
}

/**
 * Checks whether or not it is ok to retry a request.
 * @param {Error} err the error returned from the last request
 * @param {number} retryAttempt the number of times the request has already been retried
 * @param {object} options tus Upload options
 *
 * @api private
 */
function shouldRetry(err, retryAttempt, options) {
  // We only attempt a retry if
  // - retryDelays option is set
  // - we didn't exceed the maxium number of retries, yet, and
  // - this error was caused by a request or it's response and
  // - the error is server error (i.e. no a status 4xx or a 409 or 423) and
  // - the browser does not indicate that we are offline
  let status = err.originalResponse ? err.originalResponse.getStatus() : 0;
  let isServerError = !inStatusCategory(status, 400) || status === 409 || status === 423;
  return options.retryDelays != null &&
         retryAttempt < options.retryDelays.length &&
         err.originalRequest != null &&
         isServerError &&
         isOnline();
}

/**
 * Resolve a relative link given the origin as source. For example,
 * if a HTTP request to http://example.com/files/ returns a Location
 * header with the value /upload/abc, the resolved URL will be:
 * http://example.com/upload/abc
 */
function resolveUrl(origin, link) {
  return new URL(link, origin).toString();
}

BaseUpload.defaultOptions = defaultOptions;

export default BaseUpload;
