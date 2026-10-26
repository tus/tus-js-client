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
 * Coarse status of an upload. `Upload#state` is only this string.
 * `preparing`, `uploading`, `awaiting`, `retrying`, `parallel`, and `concatenating`
 * are reported as `running`.
 *
 * - `idle` — constructed, or `abort()` was called before `start()`
 * - `running` — a `start()` attempt is in progress, including an automatic retry wait
 * - `paused` — `abort()` stopped a running upload; `start()` resumes it
 * - `success` — the upload finished; further `start()` calls are ignored
 * - `error` — the upload failed after retries; `start()` tries again
 */
export type UploadState = 'idle' | 'running' | 'paused' | 'success' | 'error'

/**
 * Fields shared by every phase except `success`. Mutating `url`, `offset`, `size`,
 * `urlStorageKey`, `uploadLengthDeferred`, or a parallel URL slot does not change
 * object identity. Replacing the object does, and that identity is the attempt token.
 *
 * `source` stays null until the file has been opened, including when startup fails
 * or is aborted before then. `retrying` therefore cannot require an open source:
 * fingerprint and open failures are retried.
 */
type SessionBase = {
  url: string | null
  urlStorageKey: string | undefined
  parallelUploadUrls: string[] | undefined
  retryAttempt: number
  offsetBeforeRetry: number
  offset: number
  uploadLengthDeferred: boolean
  size: number | null
  fingerprint: string | null
  source: FileSource | null
}

type IdleState = SessionBase & { status: 'idle'; source: null }
type PreparingState = SessionBase & { status: 'preparing' }
type UploadingState = SessionBase & { status: 'uploading'; source: FileSource }
type AwaitingState = SessionBase & {
  status: 'awaiting'
  source: FileSource
  request: HttpRequest
}
type RetryingState = SessionBase & {
  status: 'retrying'
  timeout: ReturnType<typeof setTimeout>
}
type ParallelState = SessionBase & {
  status: 'parallel'
  source: FileSource
  uploads: BaseUpload[]
  partialUrls: Array<string | undefined>
}
type ConcatenatingState = SessionBase & {
  status: 'concatenating'
  source: FileSource
  request: HttpRequest
  parallelUploadUrls: string[]
}
type PausedState = SessionBase & { status: 'paused' }
type ErrorState = SessionBase & { status: 'error' }
type SuccessState = {
  status: 'success'
  url: string
  source: FileSource
  urlStorageKey: string | undefined
}

type InternalState =
  | IdleState
  | PreparingState
  | UploadingState
  | AwaitingState
  | RetryingState
  | ParallelState
  | ConcatenatingState
  | PausedState
  | ErrorState
  | SuccessState

type InternalStatus = InternalState['status']
type SessionState = Exclude<InternalState, SuccessState>
type StartableState = IdleState | PausedState | ErrorState
type FailableState =
  | PreparingState
  | UploadingState
  | AwaitingState
  | ParallelState
  | ConcatenatingState

type Generation = { state: InternalState }

const Stale = Symbol('tus.stale')
type Stale = typeof Stale

const allowedTransitions: Record<InternalStatus, readonly InternalStatus[]> = {
  idle: ['preparing', 'error', 'idle'],
  preparing: ['uploading', 'parallel', 'paused', 'error', 'retrying'],
  uploading: ['awaiting', 'retrying', 'paused', 'error'],
  awaiting: ['uploading', 'success', 'retrying', 'paused', 'error'],
  parallel: ['concatenating', 'paused', 'error', 'retrying'],
  concatenating: ['success', 'retrying', 'paused', 'error'],
  retrying: ['preparing', 'paused'],
  paused: ['preparing', 'error', 'paused'],
  error: ['preparing', 'error'],
  success: [],
}

export class BaseUpload {
  options: UploadOptions

  // The underlying File/Blob object
  file: UploadInput

  private _state: InternalState

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
    this._state = idleState(this.options.uploadLengthDeferred)
  }

  /**
   * The current status of this upload. Callers can read this, and only the upload
   * implementation changes it.
   */
  get state(): UploadState {
    switch (this._state.status) {
      case 'idle':
      case 'paused':
      case 'success':
      case 'error':
        return this._state.status
      default:
        return 'running'
    }
  }

  /**
   * The URL against which the file will be uploaded.
   * Derived from the current state so callers cannot assign it.
   */
  get url(): string | null {
    return this._state.url
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
    const current = this._state
    if (!isStartable(current)) return

    const resumed = {
      url: previousUpload.uploadUrl || null,
      parallelUploadUrls: previousUpload.parallelUploadUrls,
      urlStorageKey: previousUpload.urlStorageKey,
    }

    if (current.status === 'idle') {
      this._commit(current, { ...copyFields(current), ...resumed, status: 'idle', source: null })
      return
    }

    this._commit(current, { ...copyFields(current), ...resumed, status: current.status })
  }

  start(): void {
    // A second start() while the attempt is in progress, including during an
    // automatic retry, is ignored. start() after success is ignored as well.
    // start() after an error or abort() begins a new attempt.
    const current = this._state
    if (!isStartable(current)) return

    if (!this.file) {
      this._rejectStart(current, new Error('tus: no file or stream to upload provided'))
      return
    }

    if (
      ![PROTOCOL_TUS_V1, PROTOCOL_IETF_DRAFT_03, PROTOCOL_IETF_DRAFT_05].includes(
        this.options.protocol,
      )
    ) {
      this._rejectStart(current, new Error(`tus: unsupported protocol ${this.options.protocol}`))
      return
    }

    if (!this.options.endpoint && !this.options.uploadUrl && !this.url) {
      this._rejectStart(current, new Error('tus: neither an endpoint or an upload URL is provided'))
      return
    }

    const { retryDelays } = this.options
    if (retryDelays != null && Object.prototype.toString.call(retryDelays) !== '[object Array]') {
      this._rejectStart(
        current,
        new Error('tus: the `retryDelays` option must either be an array or null'),
      )
      return
    }

    if (this.options.parallelUploads > 1) {
      // Test which options are incompatible with parallel uploads.
      if (this.options.uploadUrl != null) {
        this._rejectStart(
          current,
          new Error('tus: cannot use the `uploadUrl` option when parallelUploads is enabled'),
        )
        return
      }

      if (this.options.uploadSize != null) {
        this._rejectStart(
          current,
          new Error('tus: cannot use the `uploadSize` option when parallelUploads is enabled'),
        )
        return
      }

      if (current.uploadLengthDeferred) {
        this._rejectStart(
          current,
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
          current,
          new Error(
            'tus: cannot use the `parallelUploadBoundaries` option when `parallelUploads` is disabled',
          ),
        )
        return
      }
      if (this.options.parallelUploads !== this.options.parallelUploadBoundaries.length) {
        this._rejectStart(
          current,
          new Error(
            'tus: the `parallelUploadBoundaries` must have the same length as the value of `parallelUploads`',
          ),
        )
        return
      }
    }

    // Note: `start` does not return a Promise or await the preparation on purpose.
    // Its supposed to return immediately and start the upload in the background.
    const preparing = toPreparing(current)
    const generation: Generation = { state: current }
    if (!this._replace(generation, preparing)) return
    this._drive(generation)
  }

  private _drive(generation: Generation): void {
    this._prepareAndStartUpload(generation).catch((err: unknown) => {
      if (!(err instanceof Error)) {
        throw new Error(`tus: value thrown that is not an error: ${err}`)
      }

      // Errors from the actual upload requests will bubble up to here, where
      // we then consider retrying them. Other functions should not call _emitError on their own.
      this._retryOrEmitError(generation, err)
    })
  }

  private live(): InternalState {
    return this._state
  }

  private _commit(current: InternalState, next: InternalState): boolean {
    if (this.live() !== current) return false
    const allowed = allowedTransitions[current.status]
    if (!allowed.includes(next.status)) {
      throw new Error(`tus: cannot transition from ${current.status} to ${next.status}`)
    }

    if (current.status === 'retrying') {
      clearTimeout(current.timeout)
    }

    log(`State change from ${current.status} to ${next.status}`)
    this._state = next
    return true
  }

  private _replace(generation: Generation, next: InternalState): boolean {
    if (!this._commit(generation.state, next)) return false
    generation.state = next
    return true
  }

  private _rejectStart(current: StartableState, err: Error): void {
    const generation: Generation = { state: current }
    if (!this._replace(generation, toError(current))) return
    this._emitError(err)
  }

  private async _settle<T>(
    generation: Generation,
    state: InternalState,
    task: Promise<T>,
  ): Promise<T | Stale> {
    try {
      const value = await task
      if (this.live() !== state || generation.state !== state) return Stale
      return value
    } catch (err) {
      if (this.live() !== state || generation.state !== state) return Stale
      throw err
    }
  }

  private async _discardRequest(request: HttpRequest): Promise<void> {
    try {
      await request.abort()
    } catch {
      // This request never became the current attempt.
    }
  }

  private async _prepareAndStartUpload(generation: Generation): Promise<void> {
    const preparing = generation.state
    if (preparing.status !== 'preparing' || this.live() !== preparing) return

    const fingerprint = await this._settle(
      generation,
      preparing,
      this.options.fingerprint(this.file, this.options),
    )
    if (fingerprint === Stale) return
    preparing.fingerprint = fingerprint

    if (preparing.fingerprint == null) {
      log(
        'No fingerprint was calculated meaning that the upload cannot be stored in the URL storage.',
      )
    } else {
      log(`Calculated fingerprint: ${preparing.fingerprint}`)
    }

    let source = preparing.source
    if (source == null) {
      const opened = await this._settle(
        generation,
        preparing,
        this.options.fileReader.openFile(this.file, this.options.chunkSize),
      )
      if (opened === Stale) return
      source = opened
      preparing.source = opened
    }

    if (this.live() !== preparing) return

    // First, we look at the uploadLengthDeferred option.
    // Next, we check if the caller has supplied a manual upload size.
    // Finally, we try to use the calculated size from the source object.
    if (preparing.uploadLengthDeferred) {
      preparing.size = null
    } else if (this.options.uploadSize != null) {
      preparing.size = Number(this.options.uploadSize)
      if (Number.isNaN(preparing.size)) {
        throw new Error('tus: cannot convert `uploadSize` option into a number')
      }
    } else {
      preparing.size = source.size
      if (preparing.size == null) {
        throw new Error(
          "tus: cannot automatically derive upload's size from input. Specify it manually using the `uploadSize` option or use the `uploadLengthDeferred` option",
        )
      }
    }

    if (this.live() !== preparing) return

    // If the upload was configured to use multiple requests or if we resume from
    // an upload which used multiple requests, we start a parallel upload.
    if (this.options.parallelUploads > 1 || preparing.parallelUploadUrls != null) {
      await this._startParallelUpload(generation, preparing)
      return
    }

    const uploading = toUploading(preparing)
    if (!this._replace(generation, uploading)) return
    await this._startSingleUpload(generation, uploading)
  }

  /**
   * Initiate the uploading procedure for a parallelized upload, where one file is split into
   * multiple request which are run in parallel.
   *
   * @api private
   */
  private async _startParallelUpload(
    generation: Generation,
    preparing: PreparingState,
  ): Promise<void> {
    if (this.live() !== preparing) return

    if (preparing.size == null) {
      throw new Error('tus: Expected _size to be set')
    }
    if (preparing.source == null) {
      throw new Error('tus: Expected source to be set')
    }

    const totalSize = preparing.size
    const source = preparing.source
    let totalProgress = 0
    const uploads: BaseUpload[] = []
    const partCount =
      preparing.parallelUploadUrls != null
        ? preparing.parallelUploadUrls.length
        : this.options.parallelUploads
    const partialUrls: Array<string | undefined> = new Array(partCount)
    const parallel = toParallel(preparing, uploads, partialUrls)
    if (!this._replace(generation, parallel)) return

    // The input file will be split into multiple slices which are uploaded in separate
    // requests. Here we get the start and end position for the slices.
    const partsBoundaries =
      this.options.parallelUploadBoundaries ?? splitSizeIntoParts(totalSize, partCount)

    // Attach URLs from previous uploads, if available.
    const previousUrls = parallel.parallelUploadUrls
    const parts = partsBoundaries.map((part, index) => ({
      ...part,
      uploadUrl: previousUrls?.[index],
    }))

    // Generate a promise for each slice that will be resolve if the respective
    // upload is completed.
    const uploadTasks = parts.map(async (part, index) => {
      let lastPartProgress = 0

      const sliced = await this._settle(generation, parallel, source.slice(part.start, part.end))
      if (sliced === Stale) return

      if (sliced.value == null) {
        throw new Error('tus: no value returned while slicing file for parallel uploads')
      }
      const { value } = sliced

      let upload: BaseUpload | undefined
      await new Promise<void>((resolve, reject) => {
        if (this.live() !== parallel) {
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
            this._emitProgress(totalProgress, totalSize)
          },
          // Wait until every partial upload has an upload URL, so we can add
          // them to the URL storage.
          onUploadUrlAvailable: async () => {
            if (this.live() !== parallel || upload == null) return

            parallel.partialUrls[index] = upload.url ?? undefined
            // Test if all uploads have received an URL
            if (parallel.partialUrls.filter((url) => url != null).length === parts.length) {
              parallel.parallelUploadUrls = parallel.partialUrls.filter(
                (url): url is string => url != null,
              )
              await this._saveUploadInUrlStorage(parallel)
            }
          },
        }

        upload = new BaseUpload(value, options)
        // Store the upload before start(), so abort() can see it once this attempt awaits.
        parallel.uploads.push(upload)
        upload.start()
      })
    })

    // Wait until all partial uploads are finished and we can send the POST request for
    // creating the final upload.
    try {
      await Promise.all(uploadTasks)
    } catch (err) {
      if (this.live() !== parallel) return
      throw err
    }
    if (this.live() !== parallel) return

    const finalUrls = parallel.partialUrls.filter((url): url is string => url != null)
    if (finalUrls.length !== parts.length) {
      throw new Error('tus: missing parallel upload URL')
    }
    parallel.parallelUploadUrls = finalUrls

    if (this.options.endpoint == null) {
      throw new Error('tus: Expected options.endpoint to be set')
    }
    const req = openRequest('POST', this.options.endpoint, this.options)
    req.setHeader('Upload-Concat', `final;${finalUrls.join(' ')}`)

    // Add metadata if values have been added
    const metadata = encodeMetadata(this.options.metadata)
    if (metadata !== '') {
      req.setHeader('Upload-Metadata', metadata)
    }

    const concatenating = toConcatenating(parallel, req, finalUrls)
    if (!this._replace(generation, concatenating)) {
      await this._discardRequest(req)
      return
    }

    let res: HttpResponse
    try {
      const sent = await this._settle(generation, concatenating, this._sendRequest(req))
      if (sent === Stale) return
      res = sent
    } catch (err) {
      if (this.live() !== concatenating) return

      if (!(err instanceof Error)) {
        throw new Error(`tus: value thrown that is not an error: ${err}`)
      }

      throw new DetailedError('tus: failed to concatenate parallel uploads', err, req, undefined)
    }

    if (this.live() !== concatenating) return

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

    concatenating.url = resolveUrl(this.options.endpoint, location)
    log(`Created upload at ${concatenating.url}`)

    await this._emitSuccess(generation, res)
  }

  /**
   * Initiate the uploading procedure for a non-parallel upload. Here the entire file is
   * uploaded in a sequential matter.
   *
   * @api private
   */
  private async _startSingleUpload(
    generation: Generation,
    uploading: UploadingState,
  ): Promise<void> {
    if (this.live() !== uploading) return

    // The upload had been started previously and we should reuse this URL.
    if (uploading.url != null) {
      log(`Resuming upload from previous URL: ${uploading.url}`)
      await this._resumeUpload(generation, uploading)
      return
    }

    // A URL has manually been specified, so we try to resume
    if (this.options.uploadUrl != null) {
      log(`Resuming upload from provided URL: ${this.options.uploadUrl}`)
      uploading.url = this.options.uploadUrl
      await this._resumeUpload(generation, uploading)
      return
    }

    // An upload has not started for the file yet, so we start a new one
    log('Creating a new upload')
    await this._createUpload(generation, uploading)
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
    // Leave a running phase before any await. abort() of an upload that is not running
    // keeps its state: idle stays idle, success stays success, and error stays
    // error so a later start() can retry. The in-flight request is still cancelled.
    const current = this._state
    const request = requestOf(current)
    const uploads = current.status === 'parallel' ? current.uploads : undefined
    const timeout = current.status === 'retrying' ? current.timeout : undefined

    if (isActive(current)) {
      this._commit(current, toPaused(current))
    }

    // Snapshot the request and partial uploads so a start() that resumes while
    // this abort() is still settling cannot have its new request cancelled here.
    if (uploads != null) {
      for (const upload of uploads) {
        await upload.abort(shouldTerminate)
      }
    }

    // Stop any current running request.
    if (request != null) {
      await request.abort()
      // Note: We do not close the file source here, so the user can resume in the future.
    }

    // Stop any timeout used for initiating a retry. Leaving `retrying` already clears it.
    if (timeout != null) {
      clearTimeout(timeout)
    }

    if (shouldTerminate && this.url != null) {
      await terminate(this.url, this.options)
      // Remove entry from the URL storage since the upload URL is no longer valid.
      await this._removeFromUrlStorage(this._state)
    }
  }

  private _emitError(err: Error): void {
    if (typeof this.options.onError === 'function') {
      this.options.onError(err)
    } else {
      throw err
    }
  }

  private _retryOrEmitError(generation: Generation, err: Error): void {
    const current = generation.state
    // The attempt was aborted, superseded, or already finished.
    if (this.live() !== current || !isFailable(current)) return

    // Check if we should retry, when enabled, before sending the error to the user.
    if (this.options.retryDelays != null) {
      // We will reset the attempt counter if
      // - we were already able to connect to the server (offset != null) and
      // - we were able to upload a small chunk of data to the server
      const shouldResetDelays = current.offset > current.offsetBeforeRetry
      if (shouldResetDelays) {
        current.retryAttempt = 0
      }

      if (shouldRetry(err, current.retryAttempt, this.options)) {
        const delay = this.options.retryDelays[current.retryAttempt++]
        current.offsetBeforeRetry = current.offset

        // Stay publicly `running` while the retry is waiting. start() ignores
        // calls in that state, so the timer continues this attempt directly.
        this._scheduleRetry(generation, current, delay)
        return
      }
    }

    // If we are not retrying, emit the error to the user.
    if (this.live() !== current) return
    if (!this._replace(generation, toError(current))) return
    this._emitError(err)
  }

  private _scheduleRetry(generation: Generation, current: FailableState, delay: number): void {
    // The timeout can fire only after this function returns, including when delay is 0,
    // so the callback closes over the state object created below.
    const retrying: RetryingState = {
      ...copyFields(current),
      status: 'retrying',
      timeout: setTimeout(() => {
        if (this.live() !== retrying) return
        const preparing = toPreparing(retrying)
        if (!this._replace(generation, preparing)) return
        this._drive(generation)
      }, delay),
    }
    if (!this._replace(generation, retrying)) {
      clearTimeout(retrying.timeout)
    }
  }

  /**
   * Publishes notification if the upload has been successfully completed.
   *
   * @param {object} lastResponse Last HTTP response.
   * @api private
   */
  private async _emitSuccess(generation: Generation, lastResponse: HttpResponse): Promise<void> {
    const current = generation.state
    if (this.live() !== current || !isSession(current)) return

    if (this.options.removeFingerprintOnSuccess) {
      // Remove stored fingerprint and corresponding endpoint. This causes
      // new uploads of the same file to be treated as a different file.
      await this._removeFromUrlStorage(current)
      if (this.live() !== current) return
    }

    if (current.source == null || current.url == null) {
      throw new Error('tus: cannot complete an upload without a URL')
    }

    const success: SuccessState = {
      status: 'success',
      url: current.url,
      source: current.source,
      urlStorageKey: current.urlStorageKey,
    }
    if (!this._replace(generation, success)) return

    if (typeof this.options.onSuccess === 'function') {
      this.options.onSuccess({ lastResponse })
    }
  }

  private _closeSourceIfSuccess(): void {
    if (this._state.status === 'success') {
      this._state.source.close()
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
  private async _createUpload(generation: Generation, uploading: UploadingState): Promise<void> {
    if (this.live() !== uploading) return

    if (!this.options.endpoint) {
      throw new Error('tus: unable to create upload because no endpoint is provided')
    }

    const req = openRequest('POST', this.options.endpoint, this.options)

    if (uploading.uploadLengthDeferred) {
      req.setHeader('Upload-Defer-Length', '1')
    } else {
      if (uploading.size == null) {
        throw new Error('tus: expected _size to be set')
      }
      req.setHeader('Upload-Length', `${uploading.size}`)
    }

    // Add metadata if values have been added
    const metadata = encodeMetadata(this.options.metadata)
    if (metadata !== '') {
      req.setHeader('Upload-Metadata', metadata)
    }

    const awaiting = toAwaiting(uploading, req)
    if (!this._replace(generation, awaiting)) {
      await this._discardRequest(req)
      return
    }

    let res: HttpResponse | null
    try {
      if (this.options.uploadDataDuringCreation && !awaiting.uploadLengthDeferred) {
        awaiting.offset = 0
        res = await this._addChunkToRequest(generation, awaiting)
      } else {
        if (
          this.options.protocol === PROTOCOL_IETF_DRAFT_03 ||
          this.options.protocol === PROTOCOL_IETF_DRAFT_05
        ) {
          req.setHeader('Upload-Complete', '?0')
        }
        const sent = await this._settle(generation, awaiting, this._sendRequest(req))
        if (sent === Stale) return
        res = sent
      }
    } catch (err) {
      if (this.live() !== awaiting) return

      if (!(err instanceof Error)) {
        throw new Error(`tus: value thrown that is not an error: ${err}`)
      }

      throw new DetailedError('tus: failed to create upload', err, req, undefined)
    }

    if (res == null || this.live() !== awaiting) return

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

    awaiting.url = resolveUrl(this.options.endpoint, location)
    log(`Created upload at ${awaiting.url}`)

    if (typeof this.options.onUploadUrlAvailable === 'function') {
      const notified = await this._settle(
        generation,
        awaiting,
        Promise.resolve(this.options.onUploadUrlAvailable()),
      )
      if (notified === Stale) return
    }

    if (awaiting.size === 0) {
      // Nothing to upload and file was successfully created
      await this._emitSuccess(generation, res)
      this._closeSourceIfSuccess()
      return
    }

    await this._saveUploadInUrlStorage(awaiting)
    if (this.live() !== awaiting) return

    if (this.options.uploadDataDuringCreation) {
      await this._handleUploadResponse(generation, awaiting, req, res)
    } else {
      awaiting.offset = 0
      const next = toUploading(awaiting)
      if (!this._replace(generation, next)) return
      await this._performUpload(generation, next)
    }
  }

  /**
   * Try to resume an existing upload. First a HEAD request will be sent
   * to retrieve the offset. If the request fails a new upload will be
   * created. In the case of a successful response the file will be uploaded.
   *
   * @api private
   */
  private async _resumeUpload(generation: Generation, uploading: UploadingState): Promise<void> {
    if (this.live() !== uploading) return

    if (uploading.url == null) {
      throw new Error('tus: Expected url to be set')
    }
    const req = openRequest('HEAD', uploading.url, this.options)
    const awaiting = toAwaiting(uploading, req)
    if (!this._replace(generation, awaiting)) {
      await this._discardRequest(req)
      return
    }

    let res: HttpResponse
    try {
      const sent = await this._settle(generation, awaiting, this._sendRequest(req))
      if (sent === Stale) return
      res = sent
    } catch (err) {
      if (this.live() !== awaiting) return

      if (!(err instanceof Error)) {
        throw new Error(`tus: value thrown that is not an error: ${err}`)
      }

      throw new DetailedError('tus: failed to resume upload', err, req, undefined)
    }

    if (this.live() !== awaiting) return

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
        await this._removeFromUrlStorage(awaiting)
        if (this.live() !== awaiting) return
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
      awaiting.url = null
      const next = toUploading(awaiting)
      if (!this._replace(generation, next)) return
      await this._createUpload(generation, next)
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
    awaiting.uploadLengthDeferred = deferLength === '1'

    const lengthHeader = res.getHeader('Upload-Length')
    const length = lengthHeader == null ? Number.NaN : Number.parseInt(lengthHeader, 10)
    if (
      Number.isNaN(length) &&
      !awaiting.uploadLengthDeferred &&
      this.options.protocol === PROTOCOL_TUS_V1
    ) {
      throw new DetailedError('tus: invalid or missing length value', undefined, req, res)
    }

    if (typeof this.options.onUploadUrlAvailable === 'function') {
      const notified = await this._settle(
        generation,
        awaiting,
        Promise.resolve(this.options.onUploadUrlAvailable()),
      )
      if (notified === Stale) return
    }

    await this._saveUploadInUrlStorage(awaiting)
    if (this.live() !== awaiting) return

    // Upload has already been completed and we do not need to send additional
    // data to the server
    if (offset === length) {
      this._emitProgress(length, length)
      await this._emitSuccess(generation, res)
      return
    }

    awaiting.offset = offset
    const next = toUploading(awaiting)
    if (!this._replace(generation, next)) return
    await this._performUpload(generation, next)
  }

  /**
   * Start uploading the file using PATCH requests. The file will be divided
   * into chunks as specified in the chunkSize option. During the upload
   * the onProgress event handler may be invoked multiple times.
   *
   * @api private
   */
  private async _performUpload(generation: Generation, uploading: UploadingState): Promise<void> {
    // If this attempt is no longer running, do not send the next PATCH request.
    // This is important if abort() was called during a callback, such as
    // onChunkComplete or onProgress.
    if (this.live() !== uploading) return

    if (uploading.url == null) {
      throw new Error('tus: Expected url to be set')
    }
    // Some browser and servers may not support the PATCH method. For those
    // cases, you can tell tus-js-client to use a POST request with the
    // X-HTTP-Method-Override header for simulating a PATCH request.
    const req = this.options.overridePatchMethod
      ? openRequest('POST', uploading.url, this.options)
      : openRequest('PATCH', uploading.url, this.options)

    if (this.options.overridePatchMethod) {
      req.setHeader('X-HTTP-Method-Override', 'PATCH')
    }

    req.setHeader('Upload-Offset', `${uploading.offset}`)

    const awaiting = toAwaiting(uploading, req)
    if (!this._replace(generation, awaiting)) {
      await this._discardRequest(req)
      return
    }

    let res: HttpResponse | null
    try {
      res = await this._addChunkToRequest(generation, awaiting)
    } catch (err) {
      // Don't emit an error if the upload was aborted manually
      if (this.live() !== awaiting) return

      if (!(err instanceof Error)) {
        throw new Error(`tus: value thrown that is not an error: ${err}`)
      }

      throw new DetailedError(
        `tus: failed to upload chunk at offset ${awaiting.offset}`,
        err,
        req,
        undefined,
      )
    }

    if (res == null || this.live() !== awaiting) return

    if (!inStatusCategory(res.getStatus(), 200)) {
      throw new DetailedError('tus: unexpected response while uploading chunk', undefined, req, res)
    }

    await this._handleUploadResponse(generation, awaiting, req, res)
  }

  /**
   * _addChunktoRequest reads a chunk from the source and sends it using the
   * supplied request object. It will not handle the response.
   *
   * @api private
   */
  private async _addChunkToRequest(
    generation: Generation,
    awaiting: AwaitingState,
  ): Promise<HttpResponse | null> {
    const start = awaiting.offset
    let end = awaiting.offset + this.options.chunkSize
    const req = awaiting.request

    req.setProgressHandler((bytesSent) => {
      this._emitProgress(start + bytesSent, awaiting.size)
    })

    if (this.options.protocol === PROTOCOL_TUS_V1) {
      req.setHeader('Content-Type', 'application/offset+octet-stream')
    } else if (this.options.protocol === PROTOCOL_IETF_DRAFT_05) {
      req.setHeader('Content-Type', 'application/partial-upload')
    }

    // The specified chunkSize may be Infinity or the calcluated end position
    // may exceed the file's size. In both cases, we limit the end position to
    // the input's total size for simpler calculations and correctness.
    const knownSize = awaiting.size
    if (
      knownSize != null &&
      !awaiting.uploadLengthDeferred &&
      (end === Number.POSITIVE_INFINITY || end > knownSize)
    ) {
      end = knownSize
    }

    // If abort() wins while the source is being read, do not send the chunk.
    const sliced = await this._settle(generation, awaiting, awaiting.source.slice(start, end))
    if (sliced === Stale) return null

    const { value, done } = sliced
    const sizeOfValue = sliced.size ?? 0

    // If the upload length is deferred, the upload size was not specified during
    // upload creation. So, if the file reader is done reading, we know the total
    // upload size and can tell the tus server.
    if (awaiting.uploadLengthDeferred && done) {
      awaiting.size = awaiting.offset + sizeOfValue
      req.setHeader('Upload-Length', `${awaiting.size}`)
      awaiting.uploadLengthDeferred = false
    }

    // The specified uploadSize might not match the actual amount of data that a source
    // provides. In these cases, we cannot successfully complete the upload, so we
    // rather error out and let the user know. If not, tus-js-client will be stuck
    // in a loop of repeating empty PATCH requests.
    // See https://community.transloadit.com/t/how-to-abort-hanging-companion-uploads/16488/13
    const newSize = awaiting.offset + sizeOfValue
    if (!awaiting.uploadLengthDeferred && done && newSize !== awaiting.size) {
      throw new Error(
        `upload was configured with a size of ${awaiting.size} bytes, but the source is done after ${newSize} bytes`,
      )
    }

    if (value == null) {
      const response = await this._settle(generation, awaiting, this._sendRequest(req))
      if (response === Stale) return null
      return response
    }

    if (
      this.options.protocol === PROTOCOL_IETF_DRAFT_03 ||
      this.options.protocol === PROTOCOL_IETF_DRAFT_05
    ) {
      req.setHeader('Upload-Complete', done ? '?1' : '?0')
    }
    this._emitProgress(awaiting.offset, awaiting.size)
    const response = await this._settle(generation, awaiting, this._sendRequest(req, value))
    if (response === Stale) return null
    return response
  }

  /**
   * _handleUploadResponse is used by requests that haven been sent using _addChunkToRequest
   * and already have received a response.
   *
   * @api private
   */
  private async _handleUploadResponse(
    generation: Generation,
    awaiting: AwaitingState,
    req: HttpRequest,
    res: HttpResponse,
  ): Promise<void> {
    if (this.live() !== awaiting) return

    // TODO: || '' is not very good.
    const offset = Number.parseInt(res.getHeader('Upload-Offset') || '', 10)
    if (Number.isNaN(offset)) {
      throw new DetailedError('tus: invalid or missing offset value', undefined, req, res)
    }

    const previousOffset = awaiting.offset
    this._emitProgress(offset, awaiting.size)
    this._emitChunkComplete(offset - previousOffset, offset, awaiting.size)

    // Callbacks may abort() before this assignment. The accepted offset used to live on
    // one field, so it was visible to the paused upload and to a start() issued from
    // the callback. Publish it onto whichever session is current now.
    this._publishOffset(offset)
    if (this.live() !== awaiting) return

    if (awaiting.size != null && offset === awaiting.size) {
      // Yay, finally done :)
      await this._emitSuccess(generation, res)
      this._closeSourceIfSuccess()
      return
    }

    const next = toUploading(awaiting)
    if (!this._replace(generation, next)) return
    await this._performUpload(generation, next)
  }

  private _publishOffset(offset: number): void {
    const state = this._state
    if (state.status === 'success') return
    state.offset = offset
  }

  /**
   * Remove the entry in the URL storage, if it has been saved before.
   *
   * @api private
   */
  private async _removeFromUrlStorage(state: InternalState): Promise<void> {
    const key = state.urlStorageKey
    if (!key) return

    await this.options.urlStorage.removeUpload(key)
    if (this._state.urlStorageKey === key) {
      this._state.urlStorageKey = undefined
    }
  }

  /**
   * Add the upload URL to the URL storage, if possible.
   *
   * @api private
   */
  private async _saveUploadInUrlStorage(state: SessionState): Promise<void> {
    // We do not store the upload URL
    // - if it was disabled in the option, or
    // - if no fingerprint was calculated for the input (i.e. a stream), or
    // - if the URL is already stored (i.e. key is set alread).
    if (
      !this.options.storeFingerprintForResuming ||
      !state.fingerprint ||
      state.urlStorageKey != null
    ) {
      return
    }

    const storedUpload: PreviousUpload = {
      size: state.size,
      metadata: this.options.metadata,
      creationTime: new Date().toString(),
      urlStorageKey: state.fingerprint,
    }

    if (state.status === 'parallel' || state.status === 'concatenating') {
      // Save multiple URLs if the parallelUploads option is used ...
      storedUpload.parallelUploadUrls = state.parallelUploadUrls
    } else if (state.url != null) {
      // ... otherwise we just save the one available URL.
      storedUpload.uploadUrl = state.url
    }

    const urlStorageKey = await this.options.urlStorage.addUpload(state.fingerprint, storedUpload)
    // TODO: Emit a waring if urlStorageKey is undefined. Should we even allow this?
    if (this.live() !== state) return
    state.urlStorageKey = urlStorageKey
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

function idleState(uploadLengthDeferred: boolean): IdleState {
  return {
    status: 'idle',
    url: null,
    urlStorageKey: undefined,
    parallelUploadUrls: undefined,
    retryAttempt: 0,
    offsetBeforeRetry: 0,
    offset: 0,
    uploadLengthDeferred,
    size: null,
    fingerprint: null,
    source: null,
  }
}

function copyFields(state: SessionState): SessionBase {
  return {
    url: state.url,
    urlStorageKey: state.urlStorageKey,
    parallelUploadUrls: state.parallelUploadUrls,
    retryAttempt: state.retryAttempt,
    offsetBeforeRetry: state.offsetBeforeRetry,
    offset: state.offset,
    uploadLengthDeferred: state.uploadLengthDeferred,
    size: state.size,
    fingerprint: state.fingerprint,
    source: state.source,
  }
}

function toPreparing(state: SessionState): PreparingState {
  return { ...copyFields(state), status: 'preparing' }
}

function toError(state: SessionState): ErrorState {
  return { ...copyFields(state), status: 'error' }
}

function toPaused(state: SessionState): PausedState {
  return { ...copyFields(state), status: 'paused' }
}

function toUploading(state: SessionState): UploadingState {
  if (state.source == null) {
    throw new Error('tus: Expected source to be set')
  }
  return { ...copyFields(state), status: 'uploading', source: state.source }
}

function toAwaiting(state: UploadingState, request: HttpRequest): AwaitingState {
  return { ...copyFields(state), status: 'awaiting', source: state.source, request }
}

function toParallel(
  state: PreparingState,
  uploads: BaseUpload[],
  partialUrls: Array<string | undefined>,
): ParallelState {
  if (state.source == null) {
    throw new Error('tus: Expected source to be set')
  }
  return {
    ...copyFields(state),
    status: 'parallel',
    source: state.source,
    uploads,
    partialUrls,
  }
}

function toConcatenating(
  state: ParallelState,
  request: HttpRequest,
  parallelUploadUrls: string[],
): ConcatenatingState {
  return {
    ...copyFields(state),
    status: 'concatenating',
    source: state.source,
    request,
    parallelUploadUrls,
  }
}

function isStartable(state: InternalState): state is StartableState {
  return state.status === 'idle' || state.status === 'paused' || state.status === 'error'
}

function isActive(
  state: InternalState,
): state is
  | PreparingState
  | UploadingState
  | AwaitingState
  | RetryingState
  | ParallelState
  | ConcatenatingState {
  return (
    state.status === 'preparing' ||
    state.status === 'uploading' ||
    state.status === 'awaiting' ||
    state.status === 'retrying' ||
    state.status === 'parallel' ||
    state.status === 'concatenating'
  )
}

function isFailable(state: InternalState): state is FailableState {
  return (
    state.status === 'preparing' ||
    state.status === 'uploading' ||
    state.status === 'awaiting' ||
    state.status === 'parallel' ||
    state.status === 'concatenating'
  )
}

function isSession(state: InternalState): state is SessionState {
  return state.status !== 'success'
}

function requestOf(state: InternalState): HttpRequest | undefined {
  if (state.status === 'awaiting' || state.status === 'concatenating') return state.request
  return undefined
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
