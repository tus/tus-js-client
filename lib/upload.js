/* global window */
import DetailedError from "./error";
import extend from "extend";
import { Base64 } from "js-base64";

// We import the files used inside the Node environment which are rewritten
// for browsers using the rules defined in the package.json
import { newRequest, resolveUrl } from "./node/request";
import { getSource } from "./node/source";
import { getStorage } from "./node/storage";
import fingerprint from "./node/fingerprint";

const defaultOptions = {
  endpoint: null,
  fingerprint,
  resume: true,
  onProgress: null,
  onChunkComplete: null,
  onSuccess: null,
  onError: null,
  headers: {},
  chunkSize: Infinity,
  withCredentials: false,
  uploadUrl: null,
  uploadSize: null,
  overridePatchMethod: false,
  retryDelays: null,
  removeFingerprintOnSuccess: false,
  uploadLengthDeferred: false,
  urlStorage: null,
  fileReader: null,
  uploadDataDuringCreation: false
};

class Upload {
  constructor(file, options) {
    this.options = extend(true, {}, defaultOptions, options);

    // The storage module used to store URLs
    this._storage = this.options.urlStorage;

    // The underlying File/Blob object
    this.file = file;

    // The URL against which the file will be uploaded
    this.url = null;

    // The underlying XHR object for the current PATCH request
    this._xhr = null;

    // The fingerpinrt for the current file (set after start())
    this._fingerprint = null;

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

    let xhr = newRequest();
    xhr.open("DELETE", url, true);

    xhr.onload = () => {
      if (xhr.status !== 204) {
        cb(new DetailedError(new Error("tus: unexpected response while terminating upload"), null, xhr));
        return;
      }

      cb();
    };

    xhr.onerror = (err) => {
      cb(new DetailedError(err, new Error("tus: failed to terminate upload"), xhr));
    };

    setupXHR(xhr, options);
    xhr.send(null);
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

    if (this.options.resume && this._storage == null) {
      this._storage = getStorage();
    }

    if (this._source) {
      this._start(this._source);
    } else {
      const fileReader = this.options.fileReader || getSource;
      fileReader(file, this.options.chunkSize, (err, source) => {
        if (err) {
          this._emitError(err);
          return;
        }

        this._source = source;
        this._start(source);
      });
    }
  }

  _start(source) {
    let file = this.file;

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

          let isOnline = true;
          if (typeof window !== "undefined" &&
             "navigator" in window &&
             window.navigator.onLine === false) {
            isOnline = false;
          }

          // We only attempt a retry if
          // - we didn't exceed the maxium number of retries, yet, and
          // - this error was caused by a request or it's response and
          // - the error is server error (i.e. no a status 4xx or a 409 or 423) and
          // - the browser does not indicate that we are offline
          let status = err.originalRequest ? err.originalRequest.status : 0;
          let isServerError = !inStatusCategory(status, 400) || status === 409 || status === 423;
          let shouldRetry = this._retryAttempt < retryDelays.length &&
                            err.originalRequest != null &&
                            isServerError &&
                            isOnline;

          if (!shouldRetry) {
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

    // Try to find the endpoint for the file in the storage
    if (this._hasStorage()) {
      this.options.fingerprint(file, this.options, (err, fingerprintValue) => {
        if (err) {
          this._emitError(err);
          return;
        }

        this._fingerprint = fingerprintValue;
        this._storage.getItem(this._fingerprint, (err, resumedUrl) => {
          if (err) {
            this._emitError(err);
            return;
          }

          if (resumedUrl != null) {
            this.url = resumedUrl;
            this._resumeUpload();
          } else {
            this._createUpload();
          }
        });
      });
    } else {
      // An upload has not started for the file yet, so we start a new one
      this._createUpload();
    }
  }

  abort(shouldTerminate, cb) {
    if (this._xhr !== null) {
      this._xhr.abort();
      this._source.close();
    }
    this._aborted = true;

    if (this._retryTimeout != null) {
      clearTimeout(this._retryTimeout);
      this._retryTimeout = null;
    }

    cb = cb || function () {};
    if (shouldTerminate) {
      Upload.terminate(this.url, this.options, (err, xhr) => {
        if (err) {
          return cb(err, xhr);
        }

        this._hasStorage() ? this._storage.removeItem(this._fingerprint, cb) : cb();
      });
    } else {
      cb();
    }
  }

  _hasStorage() {
    return this.options.resume && this._storage;
  }

  _emitXhrError(xhr, err, causingErr) {
    this._emitError(new DetailedError(err, causingErr, xhr));
  }

  _emitError(err) {
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
   * Set the headers used in the request and the withCredentials property
   * as defined in the options
   *
   * @param {XMLHttpRequest} xhr
   */
  _setupXHR(xhr) {
    this._xhr = xhr;
    setupXHR(xhr, this.options);
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

    let xhr = newRequest();
    xhr.open("POST", this.options.endpoint, true);

    xhr.onload = () => {
      if (!inStatusCategory(xhr.status, 200)) {
        this._emitXhrError(xhr, new Error("tus: unexpected response while creating upload"));
        return;
      }

      let location = xhr.getResponseHeader("Location");
      if (location == null) {
        this._emitXhrError(xhr, new Error("tus: invalid or missing Location header"));
        return;
      }

      this.url = resolveUrl(this.options.endpoint, location);

      if (this._size === 0) {
        // Nothing to upload and file was successfully created
        this._emitSuccess();
        this._source.close();
        return;
      }

      if (this._hasStorage()) {
        this._storage.setItem(this._fingerprint, this.url, (err) => {
          if (err) {
            this._emitError(err);
          }
        });
      }

      if (this.options.uploadDataDuringCreation) {
        this._handleUploadResponse(xhr);
      } else {
        this._offset = 0;
        this._startUpload();

      }
    };

    xhr.onerror = (err) => {
      this._emitXhrError(xhr, new Error("tus: failed to create upload"), err);
    };

    this._setupXHR(xhr);
    if (this.options.uploadLengthDeferred) {
      xhr.setRequestHeader("Upload-Defer-Length", 1);
    } else {
      xhr.setRequestHeader("Upload-Length", this._size);
    }

    // Add metadata if values have been added
    var metadata = encodeMetadata(this.options.metadata);
    if (metadata !== "") {
      xhr.setRequestHeader("Upload-Metadata", metadata);
    }

    if (this.options.uploadDataDuringCreation && !this.options.uploadLengthDeferred) {
      this._offset = 0;
      this._addChunkToRequest(xhr);
    } else {
      xhr.send(null);
    }
  }

  /*
   * Try to resume an existing upload. First a HEAD request will be sent
   * to retrieve the offset. If the request fails a new upload will be
   * created. In the case of a successful response the file will be uploaded.
   *
   * @api private
   */
  _resumeUpload() {
    let xhr = newRequest();
    xhr.open("HEAD", this.url, true);

    xhr.onload = () => {
      if (!inStatusCategory(xhr.status, 200)) {
        if (this._hasStorage() && inStatusCategory(xhr.status, 400)) {
          // Remove stored fingerprint and corresponding endpoint,
          // on client errors since the file can not be found
          this._storage.removeItem(this._fingerprint, (err) => {
            if (err) {
              this._emitError(err);
            }
          });
        }

        // If the upload is locked (indicated by the 423 Locked status code), we
        // emit an error instead of directly starting a new upload. This way the
        // retry logic can catch the error and will retry the upload. An upload
        // is usually locked for a short period of time and will be available
        // afterwards.
        if (xhr.status === 423) {
          this._emitXhrError(xhr, new Error("tus: upload is currently locked; retry later"));
          return;
        }

        if (!this.options.endpoint) {
          // Don't attempt to create a new upload if no endpoint is provided.
          this._emitXhrError(xhr, new Error("tus: unable to resume upload (new upload cannot be created without an endpoint)"));
          return;
        }

        // Try to create a new upload
        this.url = null;
        this._createUpload();
        return;
      }

      let offset = parseInt(xhr.getResponseHeader("Upload-Offset"), 10);
      if (isNaN(offset)) {
        this._emitXhrError(xhr, new Error("tus: invalid or missing offset value"));
        return;
      }

      let length = parseInt(xhr.getResponseHeader("Upload-Length"), 10);
      if (isNaN(length) && !this.options.uploadLengthDeferred) {
        this._emitXhrError(xhr, new Error("tus: invalid or missing length value"));
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
    };

    xhr.onerror = (err) => {
      this._emitXhrError(xhr, new Error("tus: failed to resume upload"), err);
    };

    this._setupXHR(xhr);
    xhr.send(null);
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

    let xhr = newRequest();

    // Some browser and servers may not support the PATCH method. For those
    // cases, you can tell tus-js-client to use a POST request with the
    // X-HTTP-Method-Override header for simulating a PATCH request.
    if (this.options.overridePatchMethod) {
      xhr.open("POST", this.url, true);
      xhr.setRequestHeader("X-HTTP-Method-Override", "PATCH");
    } else {
      xhr.open("PATCH", this.url, true);
    }

    xhr.onload = () => {
      if (!inStatusCategory(xhr.status, 200)) {
        this._emitXhrError(xhr, new Error("tus: unexpected response while uploading chunk"));
        return;
      }

      this._handleUploadResponse(xhr);
    };

    xhr.onerror = (err) => {
      // Don't emit an error if the upload was aborted manually
      if (this._aborted) {
        return;
      }

      this._emitXhrError(xhr, new Error("tus: failed to upload chunk at offset " + this._offset), err);
    };

    this._setupXHR(xhr);

    xhr.setRequestHeader("Upload-Offset", this._offset);
    this._addChunkToRequest(xhr);
  }

  /**
   * _addChunktoRequest reads a chunk from the source and sends it using the
   * supplied XHR object. It will not handle the response.
   */
  _addChunkToRequest(xhr) {
    // Test support for progress events before attaching an event listener
    if ("upload" in xhr) {
      xhr.upload.onprogress = (e) => {
        if (!e.lengthComputable) {
          return;
        }

        this._emitProgress(start + e.loaded, this._size);
      };
    }

    xhr.setRequestHeader("Content-Type", "application/offset+octet-stream");

    let start = this._offset;
    let end = this._offset + this.options.chunkSize;

    // The specified chunkSize may be Infinity or the calcluated end position
    // may exceed the file's size. In both cases, we limit the end position to
    // the input's total size for simpler calculations and correctness.
    if ((end === Infinity || end > this._size) && !this.options.uploadLengthDeferred) {
      end = this._size;
    }

    this._source.slice(start, end, (err, value, complete) => {
      if (err) {
        this._emitError(err);
        return;
      }

      if (this.options.uploadLengthDeferred) {
        if (complete) {
          this._size = this._offset + (value && value.size ? value.size : 0);
          xhr.setRequestHeader("Upload-Length", this._size);
        }
      }

      if (value === null) {
        xhr.send();
      } else {
        xhr.send(value);
        this._emitProgress(this._offset, this._size);
      }
    });
  }

  /**
   * _handleUploadResponse is used by requests that haven been sent using _addChunkToRequest
   * and already have received a response.
   */
  _handleUploadResponse(xhr) {
    let offset = parseInt(xhr.getResponseHeader("Upload-Offset"), 10);
    if (isNaN(offset)) {
      this._emitXhrError(xhr, new Error("tus: invalid or missing offset value"));
      return;
    }

    this._emitProgress(offset, this._size);
    this._emitChunkComplete(offset - this._offset, offset, this._size);

    this._offset = offset;

    if (offset == this._size) {
      if (this.options.removeFingerprintOnSuccess && this.options.resume) {
        // Remove stored fingerprint and corresponding endpoint. This causes
        // new upload of the same file must be treated as a different file.
        this._storage.removeItem(this._fingerprint, (err) => {
          if (err) {
            this._emitError(err);
          }
        });
      }

      // Yay, finally done :)
      this._emitSuccess();
      this._source.close();
      return;
    }

    this._startUpload();
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

function setupXHR(xhr, options) {
  xhr.setRequestHeader("Tus-Resumable", "1.0.0");
  let headers = options.headers || {};

  for (let name in headers) {
    xhr.setRequestHeader(name, headers[name]);
  }

  xhr.withCredentials = options.withCredentials;
}

Upload.defaultOptions = defaultOptions;

export default Upload;
