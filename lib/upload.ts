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

/**
 * Coarse status of an upload. `Upload#state` is this value and nothing else:
 * the URL, offset, and request stay on their own properties.
 *
 * - `idle` — constructed, or `abort()` was called before `start()`
 * - `running` — a `start()` attempt is in progress, including an automatic retry wait
 * - `paused` — `abort()` stopped a running upload; `start()` resumes it
 * - `success` — the upload finished; further `start()` calls are ignored
 * - `error` — the upload failed after retries; `start()` tries again
 */
export type UploadState = 'idle' | 'running' | 'paused' | 'success' | 'error'

const allowedTransitions: Record<UploadState, readonly UploadState[]> = {
  idle: ['running', 'error'],
  running: ['paused', 'success', 'error'],
  paused: ['running', 'error'],
  error: ['running', 'error'],
  success: [],
}

export class BaseUpload {
  options: UploadOptions

  // The underlying File/Blob object
  file: UploadInput

  // The URL against which the file will be uploaded
  url: string | null = null

  /**
   * The current status of this upload. Callers can read this, and only the upload
   * implementation changes it.
   */
  get state(): UploadState {
    return this._state
  }

  // The underlying request object for the current PATCH request
  private _req?: HttpRequest

  // The fingerpinrt for the current file (set after start())
  private _fingerprint: string | null = null

  // The key that the URL storage returned when saving an URL with a fingerprint,
  private _urlStorageKey?: string

  // The offset used in the current PATCH request
  private _offset = 0

  private _state: UploadState = 'idle'

  // Identifies the start() attempt allowed to change this upload. Work started by
  // an older attempt returns once the id no longer matches, so a duplicate start(),
  // abort(), or newer start() cannot be overwritten by in-flight requests.
  private _attempt = 0

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

  // True if the remote upload resource's length is deferred (either taken from
  // upload options or HEAD response)
  private _uploadLengthDeferred: boolean

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

    this._uploadLengthDeferred = this.options.uploadLengthDeferred

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
    // A running or finished upload already has a URL. Overwriting it would make
    // the in-flight attempt disagree with the state callers can observe.
    if (this._state === 'running' || this._state === 'success') {
      return
    }

    this.url = previousUpload.uploadUrl || null
    this._parallelUploadUrls = previousUpload.parallelUploadUrls
    this._urlStorageKey = previousUpload.urlStorageKey
  }

  start(): void {
    // A second start() while the attempt is in progress, including during an
    // automatic retry, is ignored. start() after success is ignored as well.
    // start() after an error or abort() begins a new attempt.
    if (this._state === 'running' || this._state === 'success') {
      return
    }

    if (!this.file) {
      this._rejectStart(new Error('tus: no file or stream to upload provided'))
      return
    }

    if (
      ![PROTOCOL_TUS_V1, PROTOCOL_IETF_DRAFT_03, PROTOCOL_IETF_DRAFT_05].includes(
        this.options.protocol,
      )
    ) {
      this._rejectStart(new Error(`tus: unsupported protocol ${this.options.protocol}`))
      return
    }

    if (!this.options.endpoint && !this.options.uploadUrl && !this.url) {
      this._rejectStart(new Error('tus: neither an endpoint or an upload URL is provided'))
      return
    }

    const { retryDelays } = this.options
    if (retryDelays != null && Object.prototype.toString.call(retryDelays) !== '[object Array]') {
      this._rejectStart(new Error('tus: the `retryDelays` option must either be an array or null'))
      return
    }

    if (this.options.parallelUploads > 1) {
      // Test which options are incompatible with parallel uploads.
      if (this.options.uploadUrl != null) {
        this._rejectStart(
          new Error('tus: cannot use the `uploadUrl` option when parallelUploads is enabled'),
        )
        return
      }

      if (this.options.uploadSize != null) {
        this._rejectStart(
          new Error('tus: cannot use the `uploadSize` option when parallelUploads is enabled'),
        )
        return
      }

      if (this._uploadLengthDeferred) {
        this._rejectStart(
          new Error(
            'tus: cannot use the `uploadLengthDeferred` option when parallelUploads is enabled',
          ),
        )
        return
      }
    }

    if (this.options.parallelUploadBoundaries) {
      if (this.options.parallelUploads <= 1) {
        this._rejectStart(
          new Error(
            'tus: cannot use the `parallelUploadBoundaries` option when `parallelUploads` is disabled',
          ),
        )
        return
      }
      if (this.options.parallelUploads !== this.options.parallelUploadBoundaries.length) {
        this._rejectStart(
          new Error(
            'tus: the `parallelUploadBoundaries` must have the same length as the value of `parallelUploads`',
          ),
        )
        return
      }
    }

    // Note: `start` does not return a Promise or await the preparation on purpose.
    // Its supposed to return immediately and start the upload in the background.
    const attempt = ++this._attempt
    this._transition('running')
    this._runAttempt(attempt)
  }

  private _runAttempt(attempt: number): void {
    this._prepareAndStartUpload(attempt).catch((err) => {
      if (!(err instanceof Error)) {
        throw new Error(`tus: value thrown that is not an error: ${err}`)
      }

      // Errors from the actual upload requests will bubble up to here, where
      // we then consider retrying them. Other functions should not call _emitError on their own.
      this._retryOrEmitError(err, attempt)
    })
  }

  private _isCurrentAttempt(attempt: number): boolean {
    return this._state === 'running' && this._attempt === attempt
  }

  private _transition(next: UploadState): void {
    const allowed = allowedTransitions[this._state]
    if (!allowed.includes(next)) {
      throw new Error(`tus: cannot transition from ${this._state} to ${next}`)
    }

    if (this._retryTimeout != null) {
      clearTimeout(this._retryTimeout)
      this._retryTimeout = undefined
    }

    log(`State change from ${this._state} to ${next}`)
    this._state = next
  }

  private _rejectStart(err: Error): void {
    this._transition('error')
    this._emitError(err)
  }

  private async _prepareAndStartUpload(attempt: number): Promise<void> {
    this._fingerprint = await this.options.fingerprint(this.file, this.options)
    if (!this._isCurrentAttempt(attempt)) return

    if (this._fingerprint == null) {
      log(
        'No fingerprint was calculated meaning that the upload cannot be stored in the URL storage.',
      )
    } else {
      log(`Calculated fingerprint: ${this._fingerprint}`)
    }

    if (this._source == null) {
      this._source = await this.options.fileReader.openFile(this.file, this.options.chunkSize)
      if (!this._isCurrentAttempt(attempt)) return
    }

    // First, we look at the uploadLengthDeferred option.
    // Next, we check if the caller has supplied a manual upload size.
    // Finally, we try to use the calculated size from the source object.
    if (this._uploadLengthDeferred) {
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
    if (!this._isCurrentAttempt(attempt)) return

    if (this.options.parallelUploads > 1 || this._parallelUploadUrls != null) {
      await this._startParallelUpload(attempt)
    } else {
      await this._startSingleUpload(attempt)
    }
  }

  /**
   * Initiate the uploading procedure for a parallelized upload, where one file is split into
   * multiple request which are run in parallel.
   *
   * @api private
   */
  private async _startParallelUpload(attempt: number): Promise<void> {
    if (!this._isCurrentAttempt(attempt)) return

    const totalSize = this._size
    let totalProgress = 0
    const parallelUploads: BaseUpload[] = []
    this._parallelUploads = parallelUploads

    const partCount =
      this._parallelUploadUrls != null
        ? this._parallelUploadUrls.length
        : this.options.parallelUploads

    if (this._size == null) {
      throw new Error('tus: Expected _size to be set')
    }

    const source = this._source
    if (source == null) {
      throw new Error('tus: Expected source to be set')
    }

    // The input file will be split into multiple slices which are uploaded in separate
    // requests. Here we get the start and end position for the slices.
    const partsBoundaries =
      this.options.parallelUploadBoundaries ?? splitSizeIntoParts(this._size, partCount)

    // Attach URLs from previous uploads, if available.
    const previousUrls = this._parallelUploadUrls
    const parts = partsBoundaries.map((part, index) => ({
      ...part,
      uploadUrl: previousUrls?.[index],
    }))

    const parallelUploadUrls: Array<string | undefined> = new Array(parts.length)

    // Generate a promise for each slice that will be resolve if the respective
    // upload is completed.
    const uploads = parts.map(async (part, index) => {
      let lastPartProgress = 0

      const { value } = await source.slice(part.start, part.end)
      if (!this._isCurrentAttempt(attempt)) return

      if (value == null) {
        throw new Error('tus: no value returned while slicing file for parallel uploads')
      }

      let upload: BaseUpload | undefined
      await new Promise<void>((resolve, reject) => {
        if (!this._isCurrentAttempt(attempt)) {
          resolve()
          return
        }

        // Merge with the user supplied options but overwrite some values.
        const options: UploadOptions = {
          ...this.options,
          // If available, the partial upload should be resumed from a previous URL.
          uploadUrl: part.uploadUrl,
          // We take manually care of resuming for partial uploads, so they should
          // not be stored in the URL storage.
          storeFingerprintForResuming: false,
          removeFingerprintOnSuccess: false,
          // Reset the parallelUploads option to not cause recursion.
          parallelUploads: 1,
          // Reset this option as we are not doing a parallel upload.
          parallelUploadBoundaries: undefined,
          metadata: this.options.metadataForPartialUploads,
          // Add the header to indicate the this is a partial upload.
          headers: {
            ...this.options.headers,
            'Upload-Concat': 'partial',
          },
          // Reject or resolve the promise if the upload errors or completes.
          onSuccess: () => {
            resolve()
          },
          onError: (error) => {
            reject(error)
          },
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
            if (!this._isCurrentAttempt(attempt) || upload == null) return

            parallelUploadUrls[index] = upload.url ?? undefined
            // Test if all uploads have received an URL
            if (parallelUploadUrls.filter((url) => url != null).length === parts.length) {
              this._parallelUploadUrls = parallelUploadUrls.filter(
                (url): url is string => url != null,
              )
              await this._saveUploadInUrlStorage()
            }
          },
        }

        upload = new BaseUpload(value, options)
        // Store the upload before start(), so abort() can see it once this attempt awaits.
        parallelUploads.push(upload)
        upload.start()
      })
    })

    // Wait until all partial uploads are finished and we can send the POST request for
    // creating the final upload.
    await Promise.all(uploads)
    if (!this._isCurrentAttempt(attempt)) return

    const finalUrls = parallelUploadUrls.filter((url): url is string => url != null)
    if (finalUrls.length !== parts.length) {
      throw new Error('tus: missing parallel upload URL')
    }
    this._parallelUploadUrls = finalUrls

    if (this.options.endpoint == null) {
      throw new Error('tus: Expected options.endpoint to be set')
    }
    const req = this._openRequest('POST', this.options.endpoint)
    req.setHeader('Upload-Concat', `final;${finalUrls.join(' ')}`)

    // Add metadata if values have been added
    const metadata = encodeMetadata(this.options.metadata)
    if (metadata !== '') {
      req.setHeader('Upload-Metadata', metadata)
    }

    let res: HttpResponse
    try {
      res = await this._sendRequest(req)
    } catch (err) {
      if (!this._isCurrentAttempt(attempt)) return

      if (!(err instanceof Error)) {
        throw new Error(`tus: value thrown that is not an error: ${err}`)
      }

      throw new DetailedError('tus: failed to concatenate parallel uploads', err, req, undefined)
    }

    if (!this._isCurrentAttempt(attempt)) return

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

    if (!this._isCurrentAttempt(attempt)) return

    this.url = resolveUrl(this.options.endpoint, location)
    log(`Created upload at ${this.url}`)

    await this._emitSuccess(res, attempt)
  }

  /**
   * Initiate the uploading procedure for a non-parallel upload. Here the entire file is
   * uploaded in a sequential matter.
   *
   * @api private
   */
  private async _startSingleUpload(attempt: number): Promise<void> {
    if (!this._isCurrentAttempt(attempt)) return

    // The upload had been started previously and we should reuse this URL.
    if (this.url != null) {
      log(`Resuming upload from previous URL: ${this.url}`)
      return await this._resumeUpload(attempt)
    }

    // A URL has manually been specified, so we try to resume
    if (this.options.uploadUrl != null) {
      log(`Resuming upload from provided URL: ${this.options.uploadUrl}`)
      this.url = this.options.uploadUrl
      return await this._resumeUpload(attempt)
    }

    // An upload has not started for the file yet, so we start a new one
    log('Creating a new upload')
    return await this._createUpload(attempt)
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
    // Leave `running` before any await. abort() of an upload that is not running
    // keeps its state: idle stays idle, success stays success, and error stays
    // error so a later start() can retry. The in-flight request is still cancelled.
    if (this._state === 'running') {
      this._transition('paused')
    }

    // Snapshot the request and partial uploads so a start() that resumes while
    // this abort() is still settling cannot have its new request cancelled here.
    const parallelUploads = this._parallelUploads
    const req = this._req
    const retryTimeout = this._retryTimeout
    this._retryTimeout = undefined

    // Stop any parallel partial uploads, that have been started in _startParallelUploads.
    if (parallelUploads != null) {
      for (const upload of parallelUploads) {
        await upload.abort(shouldTerminate)
      }
    }

    // Stop any current running request.
    if (req != null) {
      await req.abort()
      // Note: We do not close the file source here, so the user can resume in the future.
    }

    // Stop any timeout used for initiating a retry. _transition already clears it
    // when leaving `running`; this also covers a timeout captured above.
    if (retryTimeout != null) {
      clearTimeout(retryTimeout)
    }

    if (shouldTerminate && this.url != null) {
      await terminate(this.url, this.options)
      // Remove entry from the URL storage since the upload URL is no longer valid.
      await this._removeFromUrlStorage()
    }
  }

  private _emitError(err: Error): void {
    if (typeof this.options.onError === 'function') {
      this.options.onError(err)
    } else {
      throw err
    }
  }

  private _retryOrEmitError(err: Error, attempt: number): void {
    // The attempt was aborted, superseded, or already finished.
    if (!this._isCurrentAttempt(attempt)) return

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

        // Stay in `running` while the retry is waiting. The public start() ignores
        // calls in that state, so the timer continues this attempt directly.
        this._retryTimeout = setTimeout(() => {
          this._retryTimeout = undefined
          if (!this._isCurrentAttempt(attempt)) return
          this._runAttempt(attempt)
        }, delay)
        return
      }
    }

    // If we are not retrying, emit the error to the user.
    if (!this._isCurrentAttempt(attempt)) return
    this._transition('error')
    this._emitError(err)
  }

  /**
   * Publishes notification if the upload has been successfully completed.
   *
   * @param {object} lastResponse Last HTTP response.
   * @api private
   */
  private async _emitSuccess(lastResponse: HttpResponse, attempt: number): Promise<void> {
    if (!this._isCurrentAttempt(attempt)) return

    if (this.options.removeFingerprintOnSuccess) {
      // Remove stored fingerprint and corresponding endpoint. This causes
      // new uploads of the same file to be treated as a different file.
      await this._removeFromUrlStorage()
      if (!this._isCurrentAttempt(attempt)) return
    }

    this._transition('success')

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
  private async _createUpload(attempt: number): Promise<void> {
    if (!this._isCurrentAttempt(attempt)) return

    if (!this.options.endpoint) {
      throw new Error('tus: unable to create upload because no endpoint is provided')
    }

    const req = this._openRequest('POST', this.options.endpoint)

    if (this._uploadLengthDeferred) {
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

    let res: HttpResponse | null
    try {
      if (this.options.uploadDataDuringCreation && !this._uploadLengthDeferred) {
        this._offset = 0
        res = await this._addChunkToRequest(req, attempt)
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
      if (!this._isCurrentAttempt(attempt)) return

      if (!(err instanceof Error)) {
        throw new Error(`tus: value thrown that is not an error: ${err}`)
      }

      throw new DetailedError('tus: failed to create upload', err, req, undefined)
    }

    if (res == null || !this._isCurrentAttempt(attempt)) return

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
      if (!this._isCurrentAttempt(attempt)) return
    }

    if (this._size === 0) {
      // Nothing to upload and file was successfully created
      await this._emitSuccess(res, attempt)
      if (this._state === 'success' && this._source) this._source.close()
      return
    }

    await this._saveUploadInUrlStorage()
    if (!this._isCurrentAttempt(attempt)) return

    if (this.options.uploadDataDuringCreation) {
      await this._handleUploadResponse(req, res, attempt)
    } else {
      this._offset = 0
      await this._performUpload(attempt)
    }
  }

  /**
   * Try to resume an existing upload. First a HEAD request will be sent
   * to retrieve the offset. If the request fails a new upload will be
   * created. In the case of a successful response the file will be uploaded.
   *
   * @api private
   */
  private async _resumeUpload(attempt: number): Promise<void> {
    if (!this._isCurrentAttempt(attempt)) return

    if (this.url == null) {
      throw new Error('tus: Expected url to be set')
    }
    const req = this._openRequest('HEAD', this.url)

    let res: HttpResponse
    try {
      res = await this._sendRequest(req)
    } catch (err) {
      if (!this._isCurrentAttempt(attempt)) return

      if (!(err instanceof Error)) {
        throw new Error(`tus: value thrown that is not an error: ${err}`)
      }

      throw new DetailedError('tus: failed to resume upload', err, req, undefined)
    }

    if (!this._isCurrentAttempt(attempt)) return

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
        if (!this._isCurrentAttempt(attempt)) return
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

      // Try to create a new upload. The failed HEAD response has no offset to resume.
      this.url = null
      await this._createUpload(attempt)
      return
    }

    const offsetStr = res.getHeader('Upload-Offset')
    if (offsetStr === undefined) {
      throw new DetailedError('tus: missing Upload-Offset header', undefined, req, res)
    }
    const offset = Number.parseInt(offsetStr, 10)
    if (Number.isNaN(offset)) {
      throw new DetailedError('tus: invalid Upload-Offset header', undefined, req, res)
    }

    const deferLength = res.getHeader('Upload-Defer-Length')
    this._uploadLengthDeferred = deferLength === '1'

    // @ts-expect-error parseInt also handles undefined as we want it to
    const length = Number.parseInt(res.getHeader('Upload-Length'), 10)
    if (
      Number.isNaN(length) &&
      !this._uploadLengthDeferred &&
      this.options.protocol === PROTOCOL_TUS_V1
    ) {
      throw new DetailedError('tus: invalid or missing length value', undefined, req, res)
    }

    if (typeof this.options.onUploadUrlAvailable === 'function') {
      await this.options.onUploadUrlAvailable()
      if (!this._isCurrentAttempt(attempt)) return
    }

    await this._saveUploadInUrlStorage()
    if (!this._isCurrentAttempt(attempt)) return

    // Upload has already been completed and we do not need to send additional
    // data to the server
    if (offset === length) {
      this._emitProgress(length, length)
      await this._emitSuccess(res, attempt)
      return
    }

    this._offset = offset
    await this._performUpload(attempt)
  }

  /**
   * Start uploading the file using PATCH requests. The file will be divided
   * into chunks as specified in the chunkSize option. During the upload
   * the onProgress event handler may be invoked multiple times.
   *
   * @api private
   */
  private async _performUpload(attempt: number): Promise<void> {
    // If this attempt is no longer running, do not send the next PATCH request.
    // This is important if abort() was called during a callback, such as
    // onChunkComplete or onProgress.
    if (!this._isCurrentAttempt(attempt)) {
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

    let res: HttpResponse | null
    try {
      res = await this._addChunkToRequest(req, attempt)
    } catch (err) {
      // Don't emit an error if the upload was aborted manually
      if (!this._isCurrentAttempt(attempt)) {
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

    if (res == null || !this._isCurrentAttempt(attempt)) return

    if (!inStatusCategory(res.getStatus(), 200)) {
      throw new DetailedError('tus: unexpected response while uploading chunk', undefined, req, res)
    }

    await this._handleUploadResponse(req, res, attempt)
  }

  /**
   * _addChunktoRequest reads a chunk from the source and sends it using the
   * supplied request object. It will not handle the response.
   *
   * @api private
   */
  private async _addChunkToRequest(
    req: HttpRequest,
    attempt: number,
  ): Promise<HttpResponse | null> {
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
      !this._uploadLengthDeferred
    ) {
      // @ts-expect-error _size is set here
      end = this._size
    }

    const source = this._source
    if (source == null) {
      throw new Error('tus: Expected source to be set')
    }

    // If abort() wins while the source is being read, do not send the chunk.
    const { value, size, done } = await source.slice(start, end)
    if (!this._isCurrentAttempt(attempt)) return null

    const sizeOfValue = size ?? 0

    // If the upload length is deferred, the upload size was not specified during
    // upload creation. So, if the file reader is done reading, we know the total
    // upload size and can tell the tus server.
    if (this._uploadLengthDeferred && done) {
      this._size = this._offset + sizeOfValue
      req.setHeader('Upload-Length', `${this._size}`)
      this._uploadLengthDeferred = false
    }

    // The specified uploadSize might not match the actual amount of data that a source
    // provides. In these cases, we cannot successfully complete the upload, so we
    // rather error out and let the user know. If not, tus-js-client will be stuck
    // in a loop of repeating empty PATCH requests.
    // See https://community.transloadit.com/t/how-to-abort-hanging-companion-uploads/16488/13
    const newSize = this._offset + sizeOfValue
    if (!this._uploadLengthDeferred && done && newSize !== this._size) {
      throw new Error(
        `upload was configured with a size of ${this._size} bytes, but the source is done after ${newSize} bytes`,
      )
    }

    if (value == null) {
      const response = await this._sendRequest(req)
      if (!this._isCurrentAttempt(attempt)) return null
      return response
    }

    if (
      this.options.protocol === PROTOCOL_IETF_DRAFT_03 ||
      this.options.protocol === PROTOCOL_IETF_DRAFT_05
    ) {
      req.setHeader('Upload-Complete', done ? '?1' : '?0')
    }
    this._emitProgress(this._offset, this._size)
    const response = await this._sendRequest(req, value)
    if (!this._isCurrentAttempt(attempt)) return null
    return response
  }

  /**
   * _handleUploadResponse is used by requests that haven been sent using _addChunkToRequest
   * and already have received a response.
   *
   * @api private
   */
  private async _handleUploadResponse(
    req: HttpRequest,
    res: HttpResponse,
    attempt: number,
  ): Promise<void> {
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
      await this._emitSuccess(res, attempt)
      if (this._state === 'success' && this._source) this._source.close()
      return
    }

    if (!this._isCurrentAttempt(attempt)) return
    await this._performUpload(attempt)
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

function wait(delay: number) {
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
