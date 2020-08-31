/* global window */
import { Base64 } from "js-base64";
import URL from "url-parse";
import DetailedError from "./error";
import { log } from "./logger";
import uuid from "./uuid";

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
  _onUploadUrlAvailable: null,

  overridePatchMethod: false,
  headers: {},
  addRequestId: false,
  onBeforeRequest: null,
  onAfterResponse: null,
  onShouldRetry: null,

  chunkSize: Infinity,
  retryDelays: [0, 1000, 3000, 5000],
  parallelUploads: 1,
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
    // Warn about removed options from previous versions
    if ("resume" in options) {
      console.log("tus: The `resume` option has been removed in tus-js-client v2. Please use the URL storage API instead."); // eslint-disable-line no-console
    }

    // The default options will already be added from the wrapper classes.
    this.options = options;

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

    // The key that the URL storage returned when saving an URL with a fingerprint,
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

    // The current count of attempts which have been made. Zero indicates none.
    this._retryAttempt = 0;

    // The timeout's ID which is used to delay the next retry
    this._retryTimeout = null;

    // The offset of the remote upload before the latest attempt was started.
    this._offsetBeforeRetry = 0;

    // An array of BaseUpload instances which are used for uploading the different
    // parts, if the parallelUploads option is used.
    this._parallelUploads = null;

    // An array of upload URLs which are used for uploading the different
    // parts, if the parallelUploads option is used.
    this._parallelUploadUrls = null;
  }

  /**
   * Use the Termination extension to delete an upload from the server by sending a DELETE
   * request to the specified upload URL. This is only possible if the server supports the
   * Termination extension. If the `options.retryDelays` property is set, the method will
   * also retry if an error ocurrs.
   *
   * @param {String} url The upload's URL which will be terminated.
   * @param {object} options Optional options for influencing HTTP requests.
   * @return {Promise} The Promise will be resolved/rejected when the requests finish.
   */
  static terminate(url, options = {}, cb) {
    if (typeof options === "function" || typeof cb === "function") {
      throw new Error("tus: the terminate function does not accept a callback since v2 anymore; please use the returned Promise instead");
    }

    const req = openRequest("DELETE", url, options);

    return sendRequest(req, null, options).then((res) => {
      // A 204 response indicates a successfull request
      if (res.getStatus() === 204) {
        return;
      }

      throw new DetailedError("tus: unexpected response while terminating upload", null, req, res);
    }).catch((err) => {
      if (!(err instanceof DetailedError)) {
        err = new DetailedError("tus: failed to terminate upload", err, req, null);
      }

      if (!shouldRetry(err, 0, options)) {
        throw err;
      }

      // Instead of keeping track of the retry attempts, we remove the first element from the delays
      // array. If the array is empty, all retry attempts are used up and we will bubble up the error.
      // We recursively call the terminate function will removing elements from the retryDelays array.
      const delay = options.retryDelays[0];
      const remainingDelays = options.retryDelays.slice(1);
      const newOptions = {
        ...options,
        retryDelays: remainingDelays
      };
      return new Promise((resolve) => setTimeout(resolve, delay))
        .then(() => BaseUpload.terminate(url, newOptions));
    });
  }

  findPreviousUploads() {
    return this.options.fingerprint(this.file, this.options)
      .then((fingerprint) => this._urlStorage.findUploadsByFingerprint(fingerprint));
  }

  resumeFromPreviousUpload(previousUpload) {
    this.url = previousUpload.uploadUrl || null;
    this._parallelUploadUrls = previousUpload.parallelUploadUrls || null;
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

    const retryDelays = this.options.retryDelays;
    if (retryDelays != null && Object.prototype.toString.call(retryDelays) !== "[object Array]") {
      this._emitError(new Error("tus: the `retryDelays` option must either be an array or null"));
      return;
    }

    if (this.options.parallelUploads > 1) {
      // Test which options are incompatible with parallel uploads.
      ["uploadUrl", "uploadSize", "uploadLengthDeferred"].forEach((optionName) => {
        if (this.options[optionName]) {
          this._emitError(new Error(`tus: cannot use the ${optionName} option when parallelUploads is enabled`));
        }
      });
    }

    this.options.fingerprint(file, this.options)
      .then((fingerprint) => {
        if (fingerprint == null) {
          log("No fingerprint was calculated meaning that the upload cannot be stored in the URL storage.");
        } else {
          log(`Calculated fingerprint: ${fingerprint}`);
        }

        this._fingerprint = fingerprint;

        if (this._source) {
          return this._source;
        } else {
          return this.options.fileReader.openFile(file, this.options.chunkSize);
        }
      })
      .then((source) => {
        this._source = source;

        // If the upload was configured to use multiple requests or if we resume from
        // an upload which used multiple requests, we start a parallel upload.
        if (this.options.parallelUploads > 1 || this._parallelUploadUrls != null) {
          this._startParallelUpload();
        } else {
          this._startSingleUpload();
        }
      })
      .catch((err) => {
        this._emitError(err);
      });
  }

  /**
   * Initiate the uploading procedure for a parallelized upload, where one file is split into
   * multiple request which are run in parallel.
   *
   * @api private
   */
  _startParallelUpload() {
    const totalSize = this._size = this._source.size;
    let totalProgress = 0;
    this._parallelUploads = [];

    const partCount = this._parallelUploadUrls != null ? this._parallelUploadUrls.length : this.options.parallelUploads;

    // The input file will be split into multiple slices which are uploaded in separate
    // requests. Here we generate the start and end position for the slices.
    const parts = splitSizeIntoParts(this._source.size, partCount, this._parallelUploadUrls);

    // Create an empty list for storing the upload URLs
    this._parallelUploadUrls = new Array(parts.length);

    // Generate a promise for each slice that will be resolve if the respective
    // upload is completed.
    const uploads = parts.map((part, index) => {
      let lastPartProgress = 0;

      return this._source.slice(part.start, part.end)
        .then(({ value }) => new Promise((resolve, reject) => {
          // Merge with the user supplied options but overwrite some values.
          const options = {
            ...this.options,
            // If available, the partial upload should be resumed from a previous URL.
            uploadUrl: part.uploadUrl || null,
            // We take manually care of resuming for partial uploads, so they should
            // not be stored in the URL storage.
            storeFingerprintForResuming: false,
            removeFingerprintOnSuccess: false,
            // Reset the parallelUploads option to not cause recursion.
            parallelUploads: 1,
            metadata: {},
            // Add the header to indicate the this is a partial upload.
            headers: {
              ...this.options.headers,
              "Upload-Concat": "partial"
            },
            // Reject or resolve the promise if the upload errors or completes.
            onSuccess: resolve,
            onError: reject,
            // Based in the progress for this partial upload, calculate the progress
            // for the entire final upload.
            onProgress: (newPartProgress) => {
              totalProgress = totalProgress - lastPartProgress + newPartProgress;
              lastPartProgress = newPartProgress;
              this._emitProgress(totalProgress, totalSize);
            },
            // Wait until every partial upload has an upload URL, so we can add
            // them to the URL storage.
            _onUploadUrlAvailable: () => {
              this._parallelUploadUrls[index] = upload.url;
              // Test if all uploads have received an URL
              if (this._parallelUploadUrls.filter(u => !!u).length === parts.length) {
                this._saveUploadInUrlStorage();
              }
            }
          };

          const upload = new BaseUpload(value, options);
          upload.start();

          // Store the upload in an array, so we can later abort them if necessary.
          this._parallelUploads.push(upload);
        })
        );
    });

    let req;
    // Wait until all partial uploads are finished and we can send the POST request for
    // creating the final upload.
    Promise.all(uploads).then(() => {
      req = this._openRequest("POST", this.options.endpoint);
      req.setHeader("Upload-Concat", `final;${this._parallelUploadUrls.join(" ")}`);

      // Add metadata if values have been added
      var metadata = encodeMetadata(this.options.metadata);
      if (metadata !== "") {
        req.setHeader("Upload-Metadata", metadata);
      }

      return this._sendRequest(req, null);
    }).then((res) => {
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
      log(`Created upload at ${this.url}`);

      this._emitSuccess();
    }).catch((err) => {
      this._emitError(err);
    });
  }

  /**
   * Initiate the uploading procedure for a non-parallel upload. Here the entire file is
   * uploaded in a sequential matter.
   *
   * @api private
   */
  _startSingleUpload() {
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
      this._size = this._source.size;
      if (this._size == null) {
        this._emitError(new Error("tus: cannot automatically derive upload's size from input and must be specified manually using the `uploadSize` option"));
        return;
      }
    }

    // Reset the aborted flag when the upload is started or else the
    // _performUpload will stop before sending a request if the upload has been
    // aborted previously.
    this._aborted = false;

    // The upload had been started previously and we should reuse this URL.
    if (this.url != null) {
      log(`Resuming upload from previous URL: ${this.url}`);
      this._resumeUpload();
      return;
    }

    // A URL has manually been specified, so we try to resume
    if (this.options.uploadUrl != null) {
      log(`Resuming upload from provided URL: ${this.options.url}`);
      this.url = this.options.uploadUrl;
      this._resumeUpload();
      return;
    }

    // An upload has not started for the file yet, so we start a new one
    log("Creating a new upload");
    this._createUpload();
  }

  /**
   * Abort any running request and stop the current upload. After abort is called, no event
   * handler will be invoked anymore. You can use the `start` method to resume the upload
   * again.
   * If `shouldTerminate` is true, the `terminate` function will be called to remove the
   * current upload from the server.
   *
   * @param {boolean} shouldTerminate True if the upload should be deleted from the server.
   * @return {Promise} The Promise will be resolved/rejected when the requests finish.
   */
  abort(shouldTerminate, cb) {
    if (typeof cb === "function") {
      throw new Error("tus: the abort function does not accept a callback since v2 anymore; please use the returned Promise instead");
    }

    // Stop any parallel partial uploads, that have been started in _startParallelUploads.
    if (this._parallelUploads != null) {
      this._parallelUploads.forEach((upload) => {
        upload.abort(shouldTerminate);
      });
    }

    // Stop any current running request.
    if (this._req !== null) {
      this._req.abort();
      this._source.close();
    }
    this._aborted = true;

    // Stop any timeout used for initiating a retry.
    if (this._retryTimeout != null) {
      clearTimeout(this._retryTimeout);
      this._retryTimeout = null;
    }

    if (!shouldTerminate || this.url == null) {
      return Promise.resolve();
    }

    return BaseUpload.terminate(this.url, this.options)
      // Remove entry from the URL storage since the upload URL is no longer valid.
      .then(() => this._removeFromUrlStorage());
  }

  _emitHttpError(req, res, message, causingErr) {
    this._emitError(new DetailedError(message, causingErr, req, res));
  }

  _emitError(err) {
    // Do not emit errors, e.g. from aborted HTTP requests, if the upload has been stopped.
    if (this._aborted) return;

    // Check if we should retry, when enabled, before sending the error to the user.
    if (this.options.retryDelays != null) {
      // We will reset the attempt counter if
      // - we were already able to connect to the server (offset != null) and
      // - we were able to upload a small chunk of data to the server
      let shouldResetDelays = this._offset != null && (this._offset > this._offsetBeforeRetry);
      if (shouldResetDelays) {
        this._retryAttempt = 0;
      }

      if (shouldRetry(err, this._retryAttempt, this.options)) {
        let delay = this.options.retryDelays[this._retryAttempt++];

        this._offsetBeforeRetry = this._offset;

        this._retryTimeout = setTimeout(() => {
          this.start();
        }, delay);
        return;
      }
    }

    if (typeof this.options.onError === "function") {
      this.options.onError(err);
    } else {
      throw err;
    }
  }

  /**
   * Publishes notification if the upload has been successfully completed.
   *
   * @api private
   */
  _emitSuccess() {
    if (this.options.removeFingerprintOnSuccess) {
      // Remove stored fingerprint and corresponding endpoint. This causes
      // new uploads of the same file to be treated as a different file.
      this._removeFromUrlStorage();
    }

    if (typeof this.options.onSuccess === "function") {
      this.options.onSuccess();
    }
  }

  /**
   * Publishes notification when data has been sent to the server. This
   * data may not have been accepted by the server yet.
   *
   * @param {number} bytesSent  Number of bytes sent to the server.
   * @param {number} bytesTotal Total number of bytes to be sent to the server.
   * @api private
   */
  _emitProgress(bytesSent, bytesTotal) {
    if (typeof this.options.onProgress === "function") {
      this.options.onProgress(bytesSent, bytesTotal);
    }
  }

  /**
   * Publishes notification when a chunk of data has been sent to the server
   * and accepted by the server.
   * @param {number} chunkSize  Size of the chunk that was accepted by the server.
   * @param {number} bytesAccepted Total number of bytes that have been
   *                                accepted by the server.
   * @param {number} bytesTotal Total number of bytes to be sent to the server.
   * @api private
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
      promise = this._sendRequest(req, null);
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
      log(`Created upload at ${this.url}`);

      if (typeof this.options._onUploadUrlAvailable === "function") {
        this.options._onUploadUrlAvailable();
      }

      if (this._size === 0) {
        // Nothing to upload and file was successfully created
        this._emitSuccess();
        this._source.close();
        return;
      }

      this._saveUploadInUrlStorage();

      if (this.options.uploadDataDuringCreation) {
        this._handleUploadResponse(req, res);
      } else {
        this._offset = 0;
        this._performUpload();
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
    const promise = this._sendRequest(req, null);

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

      if (typeof this.options._onUploadUrlAvailable === "function") {
        this.options._onUploadUrlAvailable();
      }

      // Upload has already been completed and we do not need to send additional
      // data to the server
      if (offset === length) {
        this._emitProgress(length, length);
        this._emitSuccess();
        return;
      }

      this._offset = offset;
      this._performUpload();
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
  _performUpload() {
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
   *
   * @api private
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
          return this._sendRequest(req);
        } else {
          this._emitProgress(this._offset, this._size);
          return this._sendRequest(req, value);
        }
      });
  }

  /**
   * _handleUploadResponse is used by requests that haven been sent using _addChunkToRequest
   * and already have received a response.
   *
   * @api private
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
      // Yay, finally done :)
      this._emitSuccess();
      this._source.close();
      return;
    }

    this._performUpload();
  }

  /**
   * Create a new HTTP request object with the given method and URL.
   *
   * @api private
   */
  _openRequest(method, url) {
    const req = openRequest(method, url, this.options);
    this._req = req;
    return req;
  }

  /**
   * Remove the entry in the URL storage, if it has been saved before.
   *
   * @api private
   */
  _removeFromUrlStorage() {
    if (!this._urlStorageKey) return;

    this._urlStorage.removeUpload(this._urlStorageKey).catch((err) => {
      this._emitError(err);
    });
    this._urlStorageKey = null;
  }

  /**
   * Add the upload URL to the URL storage, if possible.
   *
   * @api private
   */
  _saveUploadInUrlStorage() {
    // Only if a fingerprint was calculated for the input (i.e. not a stream), we can store the upload URL.
    if (!this.options.storeFingerprintForResuming || !this._fingerprint) {
      return;
    }

    const storedUpload = {
      size: this._size,
      metadata: this.options.metadata,
      creationTime: new Date().toString()
    };

    if (this._parallelUploads) {
      // Save multiple URLs if the parallelUploads option is used ...
      storedUpload.parallelUploadUrls = this._parallelUploadUrls;
    } else {
      // ... otherwise we just save the one available URL.
      storedUpload.uploadUrl = this.url;
    }

    this._urlStorage.addUpload(this._fingerprint, storedUpload)
      .then((urlStorageKey) => this._urlStorageKey = urlStorageKey)
      .catch((err) => {
        this._emitError(err);
      });
  }

  /**
   * Send a request with the provided body.
   *
   * @api private
   */
  _sendRequest(req, body = null) {
    return sendRequest(req, body, this.options);
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

/**
 * Create a new HTTP request with the specified method and URL.
 * The necessary headers that are included in every request
 * will be added, including the request ID.
 *
 * @api private
 */
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
 * Send a request with the provided body while invoking the onBeforeRequest
 * and onAfterResponse callbacks.
 *
 * @api private
 */
function sendRequest(req, body, options) {
  const onBeforeRequestPromise = (typeof options.onBeforeRequest === "function")
    ? Promise.resolve(options.onBeforeRequest(req))
    : Promise.resolve();

  return onBeforeRequestPromise.then(() => {
    return req.send(body)
      .then((res) => {
        const onAfterResponsePromise = (typeof options.onAfterResponse === "function")
          ? Promise.resolve(options.onAfterResponse(req, res))
          : Promise.resolve();

        return onAfterResponsePromise.then(() => res);
      });
  });
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
  // - the error is server error (i.e. not a status 4xx except a 409 or 423) or
  // a onShouldRetry is specified and returns true
  // - the browser does not indicate that we are offline
  if (options.retryDelays == null || retryAttempt >= options.retryDelays.length || err.originalRequest == null) {
    return false;
  }

  if (options && typeof options.onShouldRetry === "function") {
    return options.onShouldRetry(err, retryAttempt, options);
  }

  let status = err.originalResponse ? err.originalResponse.getStatus() : 0;
  return ( !inStatusCategory(status, 400) || status === 409 || status === 423 ) && isOnline();
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

/**
 * Calculate the start and end positions for the parts if an upload
 * is split into multiple parallel requests.
 *
 * @param {number} totalSize The byte size of the upload, which will be split.
 * @param {number} partCount The number in how many parts the upload will be split.
 * @param {string[]} previousUrls The upload URLs for previous parts.
 * @return {object[]}
 * @api private
 */
function splitSizeIntoParts(totalSize, partCount, previousUrls) {
  const partSize = Math.floor(totalSize / partCount);
  const parts = [];

  for (let i = 0; i < partCount; i++) {
    parts.push({
      start: partSize * i,
      end: partSize * (i + 1)
    });
  }

  parts[partCount - 1].end = totalSize;

  // Attach URLs from previous uploads, if available.
  if (previousUrls) {
    parts.forEach((part, index) => {
      part.uploadUrl = previousUrls[index] || null;
    });
  }

  return parts;
}

BaseUpload.defaultOptions = defaultOptions;

export default BaseUpload;
