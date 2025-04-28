import { Base64 } from 'js-base64'
// TODO: Package url-parse is CommonJS. Can we replace this with a ESM package that
// provides WHATWG URL? Then we can get rid of @rollup/plugin-commonjs.
import URL from 'url-parse'
import { DetailedError } from './DetailedError.js'
import { log } from './logger.js'
import {
  type FileSource,
  type HttpRequest,
  type HttpResponse,
  PROTOCOL_IETF_DRAFT_03,
  PROTOCOL_IETF_DRAFT_05,
  PROTOCOL_TUS_V1,
  type PreviousUpload,
  type SliceType,
  type UploadInput,
  type UploadOptions,
} from './options.js'
import { uuid } from './uuid.js'

export const defaultOptions = {
  endpoint: undefined,

  uploadUrl: undefined,
  metadata: {},
  metadataForPartialUploads: {},
  fingerprint: undefined,
  uploadSize: undefined,

  onProgress: undefined,
  onChunkComplete: undefined,
  onSuccess: undefined,
  onError: undefined,
  onUploadUrlAvailable: undefined,

  overridePatchMethod: false,
  headers: {},
  addRequestId: false,
  onBeforeRequest: undefined,
  onAfterResponse: undefined,
  onShouldRetry: defaultOnShouldRetry,

  chunkSize: Number.POSITIVE_INFINITY,
  retryDelays: [0, 1000, 3000, 5000],
  parallelUploads: 1,
  parallelUploadBoundaries: undefined,
  storeFingerprintForResuming: true,
  removeFingerprintOnSuccess: false,
  uploadLengthDeferred: false,
  uploadDataDuringCreation: false,

  urlStorage: undefined,
  fileReader: undefined,
  httpStack: undefined,

  protocol: PROTOCOL_TUS_V1 as UploadOptions['protocol'],
}

export class BaseUpload {
  options: UploadOptions

  // The underlying File/Blob object
  file: UploadInput

  // The URL against which the file will be uploaded
  url: string | null = null

  // The underlying request object for the current PATCH request
  private _req?: HttpRequest

  // The fingerpinrt for the current file (set after start())
  private _fingerprint: string | null = null

  // The key that the URL storage returned when saving an URL with a fingerprint,
  private _urlStorageKey?: string

  // The offset used in the current PATCH request
  private _offset = 0

  // True if the current PATCH request has been aborted
  private _aborted = false

  // The file's size in bytes
  private _size: number | null = null

  // The Source object which will wrap around the given file and provides us
  // with a unified interface for getting its size and slice chunks from its
  // content allowing us to easily handle Files, Blobs, Buffers and Streams.
  private _source?: FileSource

  // The current count of attempts which have been made. Zero indicates none.
  private _retryAttempt = 0

  // The timeout's ID which is used to delay the next retry
  private _retryTimeout?: ReturnType<typeof setTimeout>

  // The offset of the remote upload before the latest attempt was started.
  private _offsetBeforeRetry = 0

  // An array of BaseUpload instances which are used for uploading the different
  // parts, if the parallelUploads option is used.
  private _parallelUploads?: BaseUpload[]

  // An array of upload URLs which are used for uploading the different
  // parts, if the parallelUploads option is used.
  private _parallelUploadUrls?: string[]

  constructor(file: UploadInput, options: UploadOptions) {
    // Warn about removed options from previous versions
    if ('resume' in options) {
      console.log(
        'tus: The `resume` option has been removed in tus-js-client v2. Please use the URL storage API instead.',
      )
    }

    // The default options will already be added from the wrapper classes.
    this.options = options

    // Cast chunkSize to integer
    // TODO: Remove this cast
    this.options.chunkSize = Number(this.options.chunkSize)

    this.file = file
  }

  async findPreviousUploads(): Promise<PreviousUpload[]> {
    const fingerprint = await this.options.fingerprint(this.file, this.options)
    if (!fingerprint) {
      throw new Error('tus: unable to calculate fingerprint for this input file')
    }

    return await this.options.urlStorage.findUploadsByFingerprint(fingerprint)
  }

  resumeFromPreviousUpload(previousUpload: PreviousUpload): void {
    this.url = previousUpload.uploadUrl || null
    this._parallelUploadUrls = previousUpload.parallelUploadUrls
    this._urlStorageKey = previousUpload.urlStorageKey
  }

  start(): void {
    if (!this.file) {
      this._emitError(new Error('tus: no file or stream to upload provided'))
      return
    }

    if (
      ![PROTOCOL_TUS_V1, PROTOCOL_IETF_DRAFT_03, PROTOCOL_IETF_DRAFT_05].includes(
        this.options.protocol,
      )
    ) {
      this._emitError(new Error(`tus: unsupported protocol ${this.options.protocol}`))
      return
    }

    if (!this.options.endpoint && !this.options.uploadUrl && !this.url) {
      this._emitError(new Error('tus: neither an endpoint or an upload URL is provided'))
      return
    }

    const { retryDelays } = this.options
    if (retryDelays != null && Object.prototype.toString.call(retryDelays) !== '[object Array]') {
      this._emitError(new Error('tus: the `retryDelays` option must either be an array or null'))
      return
    }

    if (this.options.parallelUploads > 1) {
      // Test which options are incompatible with parallel uploads.
      if (this.options.uploadUrl != null) {
        this._emitError(
          new Error('tus: cannot use the `uploadUrl` option when parallelUploads is enabled'),
        )
        return
      }

      if (this.options.uploadSize != null) {
        this._emitError(
          new Error('tus: cannot use the `uploadSize` option when parallelUploads is enabled'),
        )
        return
      }

      if (this.options.uploadLengthDeferred) {
        this._emitError(
          new Error(
            'tus: cannot use the `uploadLengthDeferred` option when parallelUploads is enabled',
          ),
        )
        return
      }
    }

    if (this.options.parallelUploadBoundaries) {
      if (this.options.parallelUploads <= 1) {
        this._emitError(
          new Error(
            'tus: cannot use the `parallelUploadBoundaries` option when `parallelUploads` is disabled',
          ),
        )
        return
      }
      if (this.options.parallelUploads !== this.options.parallelUploadBoundaries.length) {
        this._emitError(
          new Error(
            'tus: the `parallelUploadBoundaries` must have the same length as the value of `parallelUploads`',
          ),
        )
        return
      }
    }

    // Note: `start` does not return a Promise or await the preparation on purpose.
    // Its supposed to return immediately and start the upload in the background.
    this._prepareAndStartUpload().catch((err) => {
      if (!(err instanceof Error)) {
        throw new Error(`tus: value thrown that is not an error: ${err}`)
      }

      // Errors from the actual upload requests will bubble up to here, where
      // we then consider retrying them. Other functions should not call _emitError on their own.
      this._retryOrEmitError(err)
    })
  }

  private async _prepareAndStartUpload(): Promise<void> {
    this._fingerprint = await this.options.fingerprint(this.file, this.options)
    if (this._fingerprint == null) {
      log(
        'No fingerprint was calculated meaning that the upload cannot be stored in the URL storage.',
      )
    } else {
      log(`Calculated fingerprint: ${this._fingerprint}`)
    }

    if (this._source == null) {
      this._source = await this.options.fileReader.openFile(this.file, this.options.chunkSize)
    }

    // First, we look at the uploadLengthDeferred option.
    // Next, we check if the caller has supplied a manual upload size.
    // Finally, we try to use the calculated size from the source object.
    if (this.options.uploadLengthDeferred) {
      this._size = null
    } else if (this.options.uploadSize != null) {
      this._size = Number(this.options.uploadSize)
      if (Number.isNaN(this._size)) {
        throw new Error('tus: cannot convert `uploadSize` option into a number')
      }
    } else {
      this._size = this._source.size
      if (this._size == null) {
        throw new Error(
          "tus: cannot automatically derive upload's size from input. Specify it manually using the `uploadSize` option or use the `uploadLengthDeferred` option",
        )
      }
    }

    // If the upload was configured to use multiple requests or if we resume from
    // an upload which used multiple requests, we start a parallel upload.
    if (this.options.parallelUploads > 1 || this._parallelUploadUrls != null) {
      await this._startParallelUpload()
    } else {
      await this._startSingleUpload()
    }
  }

  /**
   * Initiate the uploading procedure for a parallelized upload, where one file is split into
   * multiple request which are run in parallel.
   *
   * @api private
   */
  private async _startParallelUpload(): Promise<void> {
    const totalSize = this._size
    let totalProgress = 0
    this._parallelUploads = []

    const partCount =
      this._parallelUploadUrls != null
        ? this._parallelUploadUrls.length
        : this.options.parallelUploads

    if (this._size == null) {
      throw new Error('tus: Expected _size to be set')
    }

    // The input file will be split into multiple slices which are uploaded in separate
    // requests. Here we get the start and end position for the slices.
    const partsBoundaries =
      this.options.parallelUploadBoundaries ?? splitSizeIntoParts(this._size, partCount)

    // Attach URLs from previous uploads, if available.
    const parts = partsBoundaries.map((part, index) => ({
      ...part,
      uploadUrl: this._parallelUploadUrls?.[index] || null,
    }))

    // Create an empty list for storing the upload URLs
    this._parallelUploadUrls = new Array(parts.length)

    // Generate a promise for each slice that will be resolve if the respective
    // upload is completed.
    const uploads = parts.map(async (part, index) => {
      let lastPartProgress = 0

      // @ts-expect-error We know that `_source` is not null here.
      const { value } = await this._source.slice(part.start, part.end)

      return new Promise<void>((resolve, reject) => {
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
          // Reset this option as we are not doing a parallel upload.
          parallelUploadBoundaries: null,
          metadata: this.options.metadataForPartialUploads,
          // Add the header to indicate the this is a partial upload.
          headers: {
            ...this.options.headers,
            'Upload-Concat': 'partial',
          },
          // Reject or resolve the promise if the upload errors or completes.
          onSuccess: resolve,
          onError: reject,
          // Based in the progress for this partial upload, calculate the progress
          // for the entire final upload.
          onProgress: (newPartProgress: number) => {
            totalProgress = totalProgress - lastPartProgress + newPartProgress
            lastPartProgress = newPartProgress
            if (totalSize == null) {
              throw new Error('tus: Expected totalSize to be set')
            }
            this._emitProgress(totalProgress, totalSize)
          },
          // Wait until every partial upload has an upload URL, so we can add
          // them to the URL storage.
          onUploadUrlAvailable: async () => {
            // @ts-expect-error We know that _parallelUploadUrls is defined
            this._parallelUploadUrls[index] = upload.url
            // Test if all uploads have received an URL
            // @ts-expect-error We know that _parallelUploadUrls is defined
            if (this._parallelUploadUrls.filter((u) => Boolean(u)).length === parts.length) {
              await this._saveUploadInUrlStorage()
            }
          },
        }

        if (value == null) {
          reject(new Error('tus: no value returned while slicing file for parallel uploads'))
          return
        }

        // @ts-expect-error `value` is unknown and not an UploadInput
        const upload = new BaseUpload(value, options)
        upload.start()

        // Store the upload in an array, so we can later abort them if necessary.
        // @ts-expect-error We know that _parallelUploadUrls is defined
        this._parallelUploads.push(upload)
      })
    })

    // Wait until all partial uploads are finished and we can send the POST request for
    // creating the final upload.
    await Promise.all(uploads)

    if (this.options.endpoint == null) {
      throw new Error('tus: Expected options.endpoint to be set')
    }
    const req = this._openRequest('POST', this.options.endpoint)
    req.setHeader('Upload-Concat', `final;${this._parallelUploadUrls.join(' ')}`)

    // Add metadata if values have been added
    const metadata = encodeMetadata(this.options.metadata)
    if (metadata !== '') {
      req.setHeader('Upload-Metadata', metadata)
    }

    let res: HttpResponse
    try {
      res = await this._sendRequest(req)
    } catch (err) {
      if (!(err instanceof Error)) {
        throw new Error(`tus: value thrown that is not an error: ${err}`)
      }

      throw new DetailedError('tus: failed to concatenate parallel uploads', err, req, undefined)
    }

    if (!inStatusCategory(res.getStatus(), 200)) {
      throw new DetailedError('tus: unexpected response while creating upload', undefined, req, res)
    }

    const location = res.getHeader('Location')
    if (location == null) {
      throw new DetailedError('tus: invalid or missing Location header', undefined, req, res)
    }

    if (this.options.endpoint == null) {
      throw new Error('tus: Expeced endpoint to be defined.')
    }

    this.url = resolveUrl(this.options.endpoint, location)
    log(`Created upload at ${this.url}`)

    await this._emitSuccess(res)
  }

  /**
   * Initiate the uploading procedure for a non-parallel upload. Here the entire file is
   * uploaded in a sequential matter.
   *
   * @api private
   */
  private async _startSingleUpload(): Promise<void> {
    // Reset the aborted flag when the upload is started or else the
    // _performUpload will stop before sending a request if the upload has been
    // aborted previously.
    this._aborted = false

    // The upload had been started previously and we should reuse this URL.
    if (this.url != null) {
      log(`Resuming upload from previous URL: ${this.url}`)
      return await this._resumeUpload()
    }

    // A URL has manually been specified, so we try to resume
    if (this.options.uploadUrl != null) {
      log(`Resuming upload from provided URL: ${this.options.uploadUrl}`)
      this.url = this.options.uploadUrl
      return await this._resumeUpload()
    }

    // An upload has not started for the file yet, so we start a new one
    log('Creating a new upload')
    return await this._createUpload()
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
  async abort(shouldTerminate = false): Promise<void> {
    // Set the aborted flag before any `await`s, so no new requests are started.
    this._aborted = true

    // Stop any parallel partial uploads, that have been started in _startParallelUploads.
    if (this._parallelUploads != null) {
      for (const upload of this._parallelUploads) {
        await upload.abort(shouldTerminate)
      }
    }

    // Stop any current running request.
    if (this._req != null) {
      await this._req.abort()
      // Note: We do not close the file source here, so the user can resume in the future.
    }

    // Stop any timeout used for initiating a retry.
    if (this._retryTimeout != null) {
      clearTimeout(this._retryTimeout)
      this._retryTimeout = undefined
    }

    if (shouldTerminate && this.url != null) {
      await terminate(this.url, this.options)
      // Remove entry from the URL storage since the upload URL is no longer valid.
      await this._removeFromUrlStorage()
    }
  }

  private _emitError(err: Error): void {
    // Do not emit errors, e.g. from aborted HTTP requests, if the upload has been stopped.
    if (this._aborted) return

    if (typeof this.options.onError === 'function') {
      this.options.onError(err)
    } else {
      throw err
    }
  }

  private _retryOrEmitError(err: Error): void {
    // Do not retry if explicitly aborted
    if (this._aborted) return

    // Check if we should retry, when enabled, before sending the error to the user.
    if (this.options.retryDelays != null) {
      // We will reset the attempt counter if
      // - we were already able to connect to the server (offset != null) and
      // - we were able to upload a small chunk of data to the server
      const shouldResetDelays = this._offset != null && this._offset > this._offsetBeforeRetry
      if (shouldResetDelays) {
        this._retryAttempt = 0
      }

      if (shouldRetry(err, this._retryAttempt, this.options)) {
        const delay = this.options.retryDelays[this._retryAttempt++]

        this._offsetBeforeRetry = this._offset

        this._retryTimeout = setTimeout(() => {
          this.start()
        }, delay)
        return
      }
    }

    // If we are not retrying, emit the error to the user.
    this._emitError(err)
  }

  /**
   * Publishes notification if the upload has been successfully completed.
   *
   * @param {object} lastResponse Last HTTP response.
   * @api private
   */
  private async _emitSuccess(lastResponse: HttpResponse): Promise<void> {
    if (this.options.removeFingerprintOnSuccess) {
      // Remove stored fingerprint and corresponding endpoint. This causes
      // new uploads of the same file to be treated as a different file.
      await this._removeFromUrlStorage()
    }

    if (typeof this.options.onSuccess === 'function') {
      this.options.onSuccess({ lastResponse })
    }
  }

  /**
   * Publishes notification when data has been sent to the server. This
   * data may not have been accepted by the server yet.
   *
   * @param {number} bytesSent  Number of bytes sent to the server.
   * @param {number|null} bytesTotal Total number of bytes to be sent to the server.
   * @api private
   */
  private _emitProgress(bytesSent: number, bytesTotal: number | null): void {
    if (typeof this.options.onProgress === 'function') {
      this.options.onProgress(bytesSent, bytesTotal)
    }
  }

  /**
   * Publishes notification when a chunk of data has been sent to the server
   * and accepted by the server.
   * @param {number} chunkSize  Size of the chunk that was accepted by the server.
   * @param {number} bytesAccepted Total number of bytes that have been
   *                                accepted by the server.
   * @param {number|null} bytesTotal Total number of bytes to be sent to the server.
   * @api private
   */
  private _emitChunkComplete(
    chunkSize: number,
    bytesAccepted: number,
    bytesTotal: number | null,
  ): void {
    if (typeof this.options.onChunkComplete === 'function') {
      this.options.onChunkComplete(chunkSize, bytesAccepted, bytesTotal)
    }
  }

  /**
   * Create a new upload using the creation extension by sending a POST
   * request to the endpoint. After successful creation the file will be
   * uploaded
   *
   * @api private
   */
  private async _createUpload(): Promise<void> {
    if (!this.options.endpoint) {
      throw new Error('tus: unable to create upload because no endpoint is provided')
    }

    const req = this._openRequest('POST', this.options.endpoint)

    if (this.options.uploadLengthDeferred) {
      req.setHeader('Upload-Defer-Length', '1')
    } else {
      if (this._size == null) {
        throw new Error('tus: expected _size to be set')
      }
      req.setHeader('Upload-Length', `${this._size}`)
    }

    // Add metadata if values have been added
    const metadata = encodeMetadata(this.options.metadata)
    if (metadata !== '') {
      req.setHeader('Upload-Metadata', metadata)
    }

    let res: HttpResponse
    try {
      if (this.options.uploadDataDuringCreation && !this.options.uploadLengthDeferred) {
        this._offset = 0
        res = await this._addChunkToRequest(req)
      } else {
        if (
          this.options.protocol === PROTOCOL_IETF_DRAFT_03 ||
          this.options.protocol === PROTOCOL_IETF_DRAFT_05
        ) {
          req.setHeader('Upload-Complete', '?0')
        }
        res = await this._sendRequest(req)
      }
    } catch (err) {
      if (!(err instanceof Error)) {
        throw new Error(`tus: value thrown that is not an error: ${err}`)
      }

      throw new DetailedError('tus: failed to create upload', err, req, undefined)
    }

    if (!inStatusCategory(res.getStatus(), 200)) {
      throw new DetailedError('tus: unexpected response while creating upload', undefined, req, res)
    }

    const location = res.getHeader('Location')
    if (location == null) {
      throw new DetailedError('tus: invalid or missing Location header', undefined, req, res)
    }

    if (this.options.endpoint == null) {
      throw new Error('tus: Expected options.endpoint to be set')
    }

    this.url = resolveUrl(this.options.endpoint, location)
    log(`Created upload at ${this.url}`)

    if (typeof this.options.onUploadUrlAvailable === 'function') {
      await this.options.onUploadUrlAvailable()
    }

    if (this._size === 0) {
      // Nothing to upload and file was successfully created
      await this._emitSuccess(res)
      if (this._source) this._source.close()
      return
    }

    await this._saveUploadInUrlStorage()

    if (this.options.uploadDataDuringCreation) {
      await this._handleUploadResponse(req, res)
    } else {
      this._offset = 0
      await this._performUpload()
    }
  }

  /**
   * Try to resume an existing upload. First a HEAD request will be sent
   * to retrieve the offset. If the request fails a new upload will be
   * created. In the case of a successful response the file will be uploaded.
   *
   * @api private
   */
  private async _resumeUpload(): Promise<void> {
    if (this.url == null) {
      throw new Error('tus: Expected url to be set')
    }
    const req = this._openRequest('HEAD', this.url)

    let res: HttpResponse
    try {
      res = await this._sendRequest(req)
    } catch (err) {
      if (!(err instanceof Error)) {
        throw new Error(`tus: value thrown that is not an error: ${err}`)
      }

      throw new DetailedError('tus: failed to resume upload', err, req, undefined)
    }

    const status = res.getStatus()
    if (!inStatusCategory(status, 200)) {
      // If the upload is locked (indicated by the 423 Locked status code), we
      // emit an error instead of directly starting a new upload. This way the
      // retry logic can catch the error and will retry the upload. An upload
      // is usually locked for a short period of time and will be available
      // afterwards.
      if (status === 423) {
        throw new DetailedError('tus: upload is currently locked; retry later', undefined, req, res)
      }

      if (inStatusCategory(status, 400)) {
        // Remove stored fingerprint and corresponding endpoint,
        // on client errors since the file can not be found
        await this._removeFromUrlStorage()
      }

      if (!this.options.endpoint) {
        // Don't attempt to create a new upload if no endpoint is provided.
        throw new DetailedError(
          'tus: unable to resume upload (new upload cannot be created without an endpoint)',
          undefined,
          req,
          res,
        )
      }

      // Try to create a new upload
      this.url = null
      await this._createUpload()
    }

    const offsetStr = res.getHeader('Upload-Offset')
    if (offsetStr === undefined) {
      throw new DetailedError('tus: missing Upload-Offset header', undefined, req, res)
    }
    const offset = Number.parseInt(offsetStr, 10)
    if (Number.isNaN(offset)) {
      throw new DetailedError('tus: invalid Upload-Offset header', undefined, req, res)
    }

    // @ts-expect-error parseInt also handles undefined as we want it to
    const length = Number.parseInt(res.getHeader('Upload-Length'), 10)
    if (
      Number.isNaN(length) &&
      !this.options.uploadLengthDeferred &&
      this.options.protocol === PROTOCOL_TUS_V1
    ) {
      throw new DetailedError('tus: invalid or missing length value', undefined, req, res)
    }

    if (typeof this.options.onUploadUrlAvailable === 'function') {
      await this.options.onUploadUrlAvailable()
    }

    await this._saveUploadInUrlStorage()

    // Upload has already been completed and we do not need to send additional
    // data to the server
    if (offset === length) {
      this._emitProgress(length, length)
      await this._emitSuccess(res)
      return
    }

    this._offset = offset
    await this._performUpload()
  }

  /**
   * Start uploading the file using PATCH requests. The file will be divided
   * into chunks as specified in the chunkSize option. During the upload
   * the onProgress event handler may be invoked multiple times.
   *
   * @api private
   */
  private async _performUpload(): Promise<void> {
    // If the upload has been aborted, we will not send the next PATCH request.
    // This is important if the abort method was called during a callback, such
    // as onChunkComplete or onProgress.
    if (this._aborted) {
      return
    }

    let req: HttpRequest

    if (this.url == null) {
      throw new Error('tus: Expected url to be set')
    }
    // Some browser and servers may not support the PATCH method. For those
    // cases, you can tell tus-js-client to use a POST request with the
    // X-HTTP-Method-Override header for simulating a PATCH request.
    if (this.options.overridePatchMethod) {
      req = this._openRequest('POST', this.url)
      req.setHeader('X-HTTP-Method-Override', 'PATCH')
    } else {
      req = this._openRequest('PATCH', this.url)
    }

    req.setHeader('Upload-Offset', `${this._offset}`)

    let res: HttpResponse
    try {
      res = await this._addChunkToRequest(req)
    } catch (err) {
      // Don't emit an error if the upload was aborted manually
      if (this._aborted) {
        return
      }

      if (!(err instanceof Error)) {
        throw new Error(`tus: value thrown that is not an error: ${err}`)
      }

      throw new DetailedError(
        `tus: failed to upload chunk at offset ${this._offset}`,
        err,
        req,
        undefined,
      )
    }

    if (!inStatusCategory(res.getStatus(), 200)) {
      throw new DetailedError('tus: unexpected response while uploading chunk', undefined, req, res)
    }

    await this._handleUploadResponse(req, res)
  }

  /**
   * _addChunktoRequest reads a chunk from the source and sends it using the
   * supplied request object. It will not handle the response.
   *
   * @api private
   */
  private async _addChunkToRequest(req: HttpRequest): Promise<HttpResponse> {
    const start = this._offset
    let end = this._offset + this.options.chunkSize

    req.setProgressHandler((bytesSent) => {
      this._emitProgress(start + bytesSent, this._size)
    })

    if (this.options.protocol === PROTOCOL_TUS_V1) {
      req.setHeader('Content-Type', 'application/offset+octet-stream')
    } else if (this.options.protocol === PROTOCOL_IETF_DRAFT_05) {
      req.setHeader('Content-Type', 'application/partial-upload')
    }

    // The specified chunkSize may be Infinity or the calcluated end position
    // may exceed the file's size. In both cases, we limit the end position to
    // the input's total size for simpler calculations and correctness.
    if (
      // @ts-expect-error _size is set here
      (end === Number.POSITIVE_INFINITY || end > this._size) &&
      !this.options.uploadLengthDeferred
    ) {
      // @ts-expect-error _size is set here
      end = this._size
    }

    // TODO: What happens if abort is called during slice?
    // @ts-expect-error _source is set here
    const { value, size, done } = await this._source.slice(start, end)
    const sizeOfValue = size ?? 0

    // If the upload length is deferred, the upload size was not specified during
    // upload creation. So, if the file reader is done reading, we know the total
    // upload size and can tell the tus server.
    if (this.options.uploadLengthDeferred && done) {
      this._size = this._offset + sizeOfValue
      req.setHeader('Upload-Length', `${this._size}`)
    }

    // The specified uploadSize might not match the actual amount of data that a source
    // provides. In these cases, we cannot successfully complete the upload, so we
    // rather error out and let the user know. If not, tus-js-client will be stuck
    // in a loop of repeating empty PATCH requests.
    // See https://community.transloadit.com/t/how-to-abort-hanging-companion-uploads/16488/13
    const newSize = this._offset + sizeOfValue
    if (!this.options.uploadLengthDeferred && done && newSize !== this._size) {
      throw new Error(
        `upload was configured with a size of ${this._size} bytes, but the source is done after ${newSize} bytes`,
      )
    }

    if (value == null) {
      return await this._sendRequest(req)
    }

    if (
      this.options.protocol === PROTOCOL_IETF_DRAFT_03 ||
      this.options.protocol === PROTOCOL_IETF_DRAFT_05
    ) {
      req.setHeader('Upload-Complete', done ? '?1' : '?0')
    }
    this._emitProgress(this._offset, this._size)
    return await this._sendRequest(req, value)
  }

  /**
   * _handleUploadResponse is used by requests that haven been sent using _addChunkToRequest
   * and already have received a response.
   *
   * @api private
   */
  private async _handleUploadResponse(req: HttpRequest, res: HttpResponse): Promise<void> {
    // TODO: || '' is not very good.
    const offset = Number.parseInt(res.getHeader('Upload-Offset') || '', 10)
    if (Number.isNaN(offset)) {
      throw new DetailedError('tus: invalid or missing offset value', undefined, req, res)
    }

    this._emitProgress(offset, this._size)
    this._emitChunkComplete(offset - this._offset, offset, this._size)

    this._offset = offset

    if (offset === this._size) {
      // Yay, finally done :)
      await this._emitSuccess(res)
      if (this._source) this._source.close()
      return
    }

    await this._performUpload()
  }

  /**
   * Create a new HTTP request object with the given method and URL.
   *
   * @api private
   */
  private _openRequest(method: string, url: string): HttpRequest {
    const req = openRequest(method, url, this.options)
    this._req = req
    return req
  }

  /**
   * Remove the entry in the URL storage, if it has been saved before.
   *
   * @api private
   */
  private async _removeFromUrlStorage(): Promise<void> {
    if (!this._urlStorageKey) return

    await this.options.urlStorage.removeUpload(this._urlStorageKey)
    this._urlStorageKey = undefined
  }

  /**
   * Add the upload URL to the URL storage, if possible.
   *
   * @api private
   */
  private async _saveUploadInUrlStorage(): Promise<void> {
    // We do not store the upload URL
    // - if it was disabled in the option, or
    // - if no fingerprint was calculated for the input (i.e. a stream), or
    // - if the URL is already stored (i.e. key is set alread).
    if (
      !this.options.storeFingerprintForResuming ||
      !this._fingerprint ||
      this._urlStorageKey != null
    ) {
      return
    }

    const storedUpload: PreviousUpload = {
      size: this._size,
      metadata: this.options.metadata,
      creationTime: new Date().toString(),
      urlStorageKey: this._fingerprint,
    }

    if (this._parallelUploads) {
      // Save multiple URLs if the parallelUploads option is used ...
      storedUpload.parallelUploadUrls = this._parallelUploadUrls
    } else {
      // ... otherwise we just save the one available URL.
      // @ts-expect-error We still have to figure out the null/undefined situation.
      storedUpload.uploadUrl = this.url
    }

    const urlStorageKey = await this.options.urlStorage.addUpload(this._fingerprint, storedUpload)
    // TODO: Emit a waring if urlStorageKey is undefined. Should we even allow this?
    this._urlStorageKey = urlStorageKey
  }

  /**
   * Send a request with the provided body.
   *
   * @api private
   */
  _sendRequest(req: HttpRequest, body?: SliceType): Promise<HttpResponse> {
    return sendRequest(req, body, this.options)
  }
}

function encodeMetadata(metadata: Record<string, string>): string {
  return Object.entries(metadata)
    .map(([key, value]) => `${key} ${Base64.encode(String(value))}`)
    .join(',')
}

/**
 * Checks whether a given status is in the range of the expected category.
 * For example, only a status between 200 and 299 will satisfy the category 200.
 *
 * @api private
 */
function inStatusCategory(status: number, category: 100 | 200 | 300 | 400 | 500): boolean {
  return status >= category && status < category + 100
}

/**
 * Create a new HTTP request with the specified method and URL.
 * The necessary headers that are included in every request
 * will be added, including the request ID.
 *
 * @api private
 */
function openRequest(method: string, url: string, options: UploadOptions): HttpRequest {
  const req = options.httpStack.createRequest(method, url)

  if (options.protocol === PROTOCOL_IETF_DRAFT_03) {
    req.setHeader('Upload-Draft-Interop-Version', '5')
  } else if (options.protocol === PROTOCOL_IETF_DRAFT_05) {
    req.setHeader('Upload-Draft-Interop-Version', '6')
  } else {
    req.setHeader('Tus-Resumable', '1.0.0')
  }
  const headers = options.headers || {}

  for (const [name, value] of Object.entries(headers)) {
    req.setHeader(name, value)
  }

  if (options.addRequestId) {
    const requestId = uuid()
    req.setHeader('X-Request-ID', requestId)
  }

  return req
}

/**
 * Send a request with the provided body while invoking the onBeforeRequest
 * and onAfterResponse callbacks.
 *
 * @api private
 */
async function sendRequest(
  req: HttpRequest,
  body: SliceType | undefined,
  options: UploadOptions,
): Promise<HttpResponse> {
  if (typeof options.onBeforeRequest === 'function') {
    await options.onBeforeRequest(req)
  }

  const res = await req.send(body)

  if (typeof options.onAfterResponse === 'function') {
    await options.onAfterResponse(req, res)
  }

  return res
}

/**
 * Checks whether the browser running this code has internet access.
 * This function will always return true in the node.js environment
 * TODO: Move this into a browser-specific location.
 *
 * @api private
 */
function isOnline(): boolean {
  let online = true
  // Note: We don't reference `window` here because the navigator object also exists
  // in a Web Worker's context.
  // -disable-next-line no-undef
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    online = false
  }

  return online
}

/**
 * Checks whether or not it is ok to retry a request.
 * @param {Error|DetailedError} err the error returned from the last request
 * @param {number} retryAttempt the number of times the request has already been retried
 * @param {object} options tus Upload options
 *
 * @api private
 */
function shouldRetry(
  err: Error | DetailedError,
  retryAttempt: number,
  options: UploadOptions,
): boolean {
  // We only attempt a retry if
  // - retryDelays option is set
  // - we didn't exceed the maxium number of retries, yet, and
  // - this error was caused by a request or it's response and
  // - the error is server error (i.e. not a status 4xx except a 409 or 423) or
  // a onShouldRetry is specified and returns true
  // - the browser does not indicate that we are offline
  const isNetworkError = 'originalRequest' in err && err.originalRequest != null
  if (
    options.retryDelays == null ||
    retryAttempt >= options.retryDelays.length ||
    !isNetworkError
  ) {
    return false
  }

  if (options && typeof options.onShouldRetry === 'function') {
    return options.onShouldRetry(err, retryAttempt, options)
  }

  return defaultOnShouldRetry(err)
}

/**
 * determines if the request should be retried. Will only retry if not a status 4xx except a 409 or 423
 * @param {DetailedError} err
 * @returns {boolean}
 */
function defaultOnShouldRetry(err: DetailedError): boolean {
  const status = err.originalResponse ? err.originalResponse.getStatus() : 0
  return (!inStatusCategory(status, 400) || status === 409 || status === 423) && isOnline()
}

/**
 * Resolve a relative link given the origin as source. For example,
 * if a HTTP request to http://example.com/files/ returns a Location
 * header with the value /upload/abc, the resolved URL will be:
 * http://example.com/upload/abc
 */
function resolveUrl(origin: string, link: string): string {
  return new URL(link, origin).toString()
}

type Part = { start: number; end: number }

/**
 * Calculate the start and end positions for the parts if an upload
 * is split into multiple parallel requests.
 *
 * @param {number} totalSize The byte size of the upload, which will be split.
 * @param {number} partCount The number in how many parts the upload will be split.
 * @return {Part[]}
 * @api private
 */
function splitSizeIntoParts(totalSize: number, partCount: number): Part[] {
  const partSize = Math.floor(totalSize / partCount)
  const parts: Part[] = []

  for (let i = 0; i < partCount; i++) {
    parts.push({
      start: partSize * i,
      end: partSize * (i + 1),
    })
  }

  parts[partCount - 1].end = totalSize

  return parts
}

async function wait(delay: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, delay)
  })
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
export async function terminate(url: string, options: UploadOptions): Promise<void> {
  const req = openRequest('DELETE', url, options)

  try {
    const res = await sendRequest(req, undefined, options)
    // A 204 response indicates a successfull request
    if (res.getStatus() === 204) {
      return
    }

    throw new DetailedError(
      'tus: unexpected response while terminating upload',
      undefined,
      req,
      res,
    )
  } catch (err) {
    if (!(err instanceof Error)) {
      throw new Error(`tus: value thrown that is not an error: ${err}`)
    }

    const detailedErr =
      err instanceof DetailedError
        ? err
        : new DetailedError('tus: failed to terminate upload', err, req)

    if (!shouldRetry(detailedErr, 0, options)) {
      throw detailedErr
    }

    // Instead of keeping track of the retry attempts, we remove the first element from the delays
    // array. If the array is empty, all retry attempts are used up and we will bubble up the error.
    // We recursively call the terminate function will removing elements from the retryDelays array.
    const delay = options.retryDelays[0]
    const remainingDelays = options.retryDelays.slice(1)
    const newOptions = {
      ...options,
      retryDelays: remainingDelays,
    }

    await wait(delay)
    await terminate(url, newOptions)
  }
}
