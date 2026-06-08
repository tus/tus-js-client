import { DetailedError } from './DetailedError.js'
import { log } from './logger.js'
import type {
  FileSource,
  HttpRequest,
  HttpResponse,
  PreviousUpload,
  SliceType,
  UploadInput,
  UploadOptions,
} from './options.js'
import {
  type TusChunkCompleteEventPlanInput,
  type TusProgressEventPlanInput,
  type TusRequestPlan,
  type TusUploadUrlAvailableHookContext,
  tusCheckConfiguredUploadSize,
  tusChunkEnd,
  tusCreateUploadRequestPlan,
  tusDefaultClientOptions,
  tusDefaultRetryOnlineStatus,
  tusDefaultRetryPolicyDecision,
  tusDeferredUploadLengthPlan,
  tusFinalUploadRequestPlan,
  tusGetUploadOffsetRequestPlan,
  tusNonErrorThrownValueMessage,
  tusPatchUploadRequestPlan,
  tusPlanAbort,
  tusPlanChunkCompleteEvent,
  tusPlanCreatedUploadLog,
  tusPlanFinalUploadCreation,
  tusPlanFingerprint,
  tusPlanParallelPartialUploadOptions,
  tusPlanParallelUploadParts,
  tusPlanParallelUploadSlice,
  tusPlanPreparedFingerprintLog,
  tusPlanPreparedUploadMode,
  tusPlanPreparedUploadSize,
  tusPlanProgressEvent,
  tusPlanRemovedResumeOptionWarning,
  tusPlanRequestHeaders,
  tusPlanRequestId,
  tusPlanRequestLifecycleHooks,
  tusPlanResumeOffsetResponse,
  tusPlanResumeResponseStatus,
  tusPlanResumeUploadRequest,
  tusPlanRetryAfterError,
  tusPlanSingleUploadStart,
  tusPlanStoredUploadRecord,
  tusPlanSuccessEvent,
  tusPlanTerminateResponse,
  tusPlanTerminateUploadRequest,
  tusPlanUploadChunkRequest,
  tusPlanUploadChunkResponse,
  tusPlanUploadCompletionAfterOffset,
  tusPlanUploadCreationRequest,
  tusPlanUploadCreationResponse,
  tusPlanUploadStorage,
  tusPlanUploadUrlAvailableHook,
  tusReadUploadChunkResponse,
  tusReadUploadCreationResponse,
  tusReadUploadOffsetResponse,
  tusResolveUploadLocation,
  tusShouldEvaluateRetryPolicy,
  tusShouldSendUploadBodyDuringCreation,
  tusShouldSuppressErrorAfterAbort,
  tusShouldTreatRequestErrorAsRetryable,
  tusShouldUseCustomRetryPolicy,
  tusTerminateUploadRequestPlan,
  tusUploadBodyHeaders,
  tusUploadLengthHeaders,
  tusUrlStorageCreationTime,
  tusValidateUploadStart,
} from './protocol_generated.js'
import { uuid } from './uuid.js'

export const defaultOptions = {
  endpoint: undefined,

  uploadUrl: undefined,
  fingerprint: undefined,
  uploadSize: undefined,

  onProgress: undefined,
  onChunkComplete: undefined,
  onSuccess: undefined,
  onError: undefined,
  onUploadUrlAvailable: undefined,

  onBeforeRequest: undefined,
  onAfterResponse: undefined,
  onShouldRetry: defaultOnShouldRetry,

  parallelUploadBoundaries: undefined,

  urlStorage: undefined,
  fileReader: undefined,
  httpStack: undefined,

  ...tusDefaultClientOptions(),
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

  // True if the remote upload resource's length is deferred (either taken from
  // upload options or HEAD response)
  private _uploadLengthDeferred: boolean

  constructor(file: UploadInput, options: UploadOptions) {
    const removedResumeOptionWarning = tusPlanRemovedResumeOptionWarning({
      hasResumeOption: 'resume' in options,
    })
    if (removedResumeOptionWarning.shouldWarn) {
      console.log(removedResumeOptionWarning.message)
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
    const fingerprintPlan = tusPlanFingerprint({ fingerprint })
    if (!fingerprintPlan.ok) {
      throw new Error(fingerprintPlan.message)
    }

    return await this.options.urlStorage.findUploadsByFingerprint(fingerprintPlan.fingerprint)
  }

  resumeFromPreviousUpload(previousUpload: PreviousUpload): void {
    this.url = previousUpload.uploadUrl || null
    this._parallelUploadUrls = previousUpload.parallelUploadUrls
    this._urlStorageKey = previousUpload.urlStorageKey
  }

  start(): void {
    const startValidation = tusValidateUploadStart({
      hasCurrentUrl: this.url != null,
      hasEndpoint: this.options.endpoint != null,
      hasFile: Boolean(this.file),
      hasUploadSize: this.options.uploadSize != null,
      hasUploadUrl: this.options.uploadUrl != null,
      parallelUploadBoundariesCount: this.options.parallelUploadBoundaries?.length ?? null,
      parallelUploads: this.options.parallelUploads,
      protocol: this.options.protocol,
      retryDelays: this.options.retryDelays,
      uploadDataDuringCreation: this.options.uploadDataDuringCreation,
      uploadLengthDeferred: this._uploadLengthDeferred,
    })
    if (!startValidation.ok) {
      this._emitError(new Error(startValidation.message))
      return
    }

    // Note: `start` does not return a Promise or await the preparation on purpose.
    // Its supposed to return immediately and start the upload in the background.
    this._prepareAndStartUpload().catch((err) => {
      if (!(err instanceof Error)) {
        throw new Error(tusNonErrorThrownValueMessage({ value: err }))
      }

      // Errors from the actual upload requests will bubble up to here, where
      // we then consider retrying them. Other functions should not call _emitError on their own.
      this._retryOrEmitError(err)
    })
  }

  private async _prepareAndStartUpload(): Promise<void> {
    this._fingerprint = await this.options.fingerprint(this.file, this.options)
    log(tusPlanPreparedFingerprintLog({ fingerprint: this._fingerprint }).message)

    if (this._source == null) {
      this._source = await this.options.fileReader.openFile(this.file, this.options.chunkSize)
    }

    const preparedUploadSizePlan = tusPlanPreparedUploadSize({
      sourceSize: this._source.size,
      uploadLengthDeferred: this._uploadLengthDeferred,
      uploadSize: this.options.uploadSize,
    })
    if (!preparedUploadSizePlan.ok) {
      throw new Error(preparedUploadSizePlan.message)
    }
    this._size = preparedUploadSizePlan.size

    const preparedUploadModePlan = tusPlanPreparedUploadMode({
      hasParallelUploadUrls: this._parallelUploadUrls != null,
      parallelUploads: this.options.parallelUploads,
    })

    if (preparedUploadModePlan.action === 'parallel') {
      await this._startParallelUpload()
      return
    }

    await this._startSingleUpload()
  }

  /**
   * Initiate the uploading procedure for a parallelized upload, where one file is split into
   * multiple request which are run in parallel.
   *
   * @api private
   */
  private async _startParallelUpload(): Promise<void> {
    const parallelUploadPartsPlan = tusPlanParallelUploadParts({
      parallelUploadBoundaries: this.options.parallelUploadBoundaries,
      parallelUploads: this.options.parallelUploads,
      parallelUploadUrls: this._parallelUploadUrls,
      size: this._size,
    })
    if (!parallelUploadPartsPlan.ok) {
      throw new Error(parallelUploadPartsPlan.message)
    }

    const { parts, totalSize } = parallelUploadPartsPlan
    let totalAccepted = 0
    let totalProgress = 0
    this._parallelUploads = []

    // Create an empty list for storing the upload URLs
    this._parallelUploadUrls = new Array(parts.length)

    // Generate a promise for each slice that will be resolve if the respective
    // upload is completed.
    const uploads = parts.map(async (part, index) => {
      let lastPartAccepted = 0
      let lastPartProgress = 0

      // @ts-expect-error We know that `_source` is not null here.
      const { value } = await this._source.slice(part.start, part.end)

      return new Promise<void>((resolve, reject) => {
        const partialUploadOptions = tusPlanParallelPartialUploadOptions({
          headers: this.options.headers,
          metadataForPartialUploads: this.options.metadataForPartialUploads,
          uploadUrl: part.uploadUrl,
        })

        const options = {
          ...this.options,
          ...partialUploadOptions,
          // Reject or resolve the promise if the upload errors or completes.
          onSuccess: resolve,
          onError: reject,
          // Based in the progress for this partial upload, calculate the progress
          // for the entire final upload.
          onProgress: (newPartProgress: number) => {
            totalProgress = totalProgress - lastPartProgress + newPartProgress
            lastPartProgress = newPartProgress
            this._emitProgress({
              bytesTotal: totalSize,
              hasHook: typeof this.options.onProgress === 'function',
              phase: 'parallelPartProgress',
              totalProgress,
            })
          },
          onChunkComplete: (chunkSize: number, bytesAccepted: number) => {
            totalAccepted = totalAccepted - lastPartAccepted + bytesAccepted
            lastPartAccepted = bytesAccepted
            this._emitChunkComplete({
              bytesAccepted: totalAccepted,
              bytesTotal: totalSize,
              chunkSize,
              hasHook: typeof this.options.onChunkComplete === 'function',
              phase: 'afterChunkAccepted',
            })
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

        const slicePlan = tusPlanParallelUploadSlice({ hasValue: value != null })
        if (!slicePlan.ok) {
          reject(new Error(slicePlan.message))
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

    const finalUploadCreationPlan = tusPlanFinalUploadCreation({
      endpoint: this.options.endpoint,
      partialUploadUrls: this._parallelUploadUrls,
    })
    if (!finalUploadCreationPlan.ok) {
      throw new Error(finalUploadCreationPlan.message)
    }
    const req = this._openRequest(
      tusFinalUploadRequestPlan({
        endpoint: finalUploadCreationPlan.endpoint,
        metadata: this.options.metadata,
        protocol: this.options.protocol,
        uploadUrls: finalUploadCreationPlan.uploadUrls,
      }),
    )

    let res: HttpResponse
    try {
      res = await this._sendRequest(req)
    } catch (err) {
      if (!(err instanceof Error)) {
        throw new Error(tusNonErrorThrownValueMessage({ value: err }))
      }

      throw new DetailedError(finalUploadCreationPlan.requestErrorMessage, err, req, undefined)
    }

    const creationResponsePlan = tusPlanUploadCreationResponse({
      followUp: 'none',
      response: tusReadUploadCreationResponse({
        getHeader: (headerName) => res.getHeader(headerName),
        status: res.getStatus(),
      }),
      size: this._size,
    })
    if (creationResponsePlan.action === 'fail') {
      throw new DetailedError(creationResponsePlan.message, undefined, req, res)
    }

    this.url = tusResolveUploadLocation({
      location: creationResponsePlan.location,
      requestUrl: finalUploadCreationPlan.endpoint,
    })
    log(tusPlanCreatedUploadLog({ uploadUrl: this.url }).message)

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

    const plan = tusPlanSingleUploadStart({
      currentUrl: this.url,
      uploadUrl: this.options.uploadUrl,
    })
    log(plan.logMessage)

    if (plan.action === 'resumeCurrent') {
      return await this._resumeUpload()
    }

    if (plan.action === 'resumeConfigured') {
      this.url = plan.url
      return await this._resumeUpload()
    }

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
    const abortPlan = tusPlanAbort({
      hasCurrentRequest: this._req != null,
      hasParallelUploads: this._parallelUploads != null,
      hasRetryTimer: this._retryTimeout != null,
      shouldTerminate,
      uploadUrl: this.url,
    })

    for (const action of abortPlan.actions) {
      if (action.action === 'markAborted') {
        this._aborted = true
        continue
      }

      if (action.action === 'abortParallelUploads') {
        if (this._parallelUploads != null) {
          for (const upload of this._parallelUploads) {
            await upload.abort(action.shouldTerminate)
          }
        }
        continue
      }

      if (action.action === 'abortCurrentRequest') {
        if (this._req != null) {
          await this._req.abort()
          // Note: We do not close the file source here, so the user can resume in the future.
        }
        continue
      }

      if (action.action === 'clearRetryTimer') {
        if (this._retryTimeout != null) {
          clearTimeout(this._retryTimeout)
          this._retryTimeout = undefined
        }
        continue
      }

      if (action.action === 'terminateUpload') {
        await terminate(action.uploadUrl, this.options)
        if (action.removeStoredUpload) {
          await this._removeFromUrlStorage()
        }
      }
    }
  }

  private _emitError(err: Error): void {
    if (tusShouldSuppressErrorAfterAbort({ aborted: this._aborted })) return

    if (typeof this.options.onError === 'function') {
      this.options.onError(err)
    } else {
      throw err
    }
  }

  private _retryOrEmitError(err: Error): void {
    // Do not retry if explicitly aborted
    if (this._aborted) return

    const retryableErr = getRetryableError(err)
    const retryInput = {
      isNetworkError: retryableErr != null,
      offset: this._offset,
      offsetBeforeRetry: this._offsetBeforeRetry,
      retryDelays: this.options.retryDelays,
    }
    let retryPlan = tusPlanRetryAfterError({
      ...retryInput,
      retryAttempt: this._retryAttempt,
    })
    this._retryAttempt = retryPlan.retryAttempt

    if (
      tusShouldEvaluateRetryPolicy({
        hasRetryableError: retryableErr != null,
        retryPlanAction: retryPlan.action,
      }) &&
      retryableErr != null
    ) {
      retryPlan = tusPlanRetryAfterError({
        ...retryInput,
        retryAttempt: retryPlan.retryAttempt,
        shouldRetry: shouldRetryByPolicy(retryableErr, retryPlan.retryAttempt, this.options),
      })
      this._retryAttempt = retryPlan.retryAttempt
    }

    if (retryPlan.action === 'scheduleRetry') {
      this._retryAttempt = retryPlan.nextRetryAttempt
      this._offsetBeforeRetry = retryPlan.offsetBeforeRetry

      this._retryTimeout = setTimeout(() => {
        this.start()
      }, retryPlan.delay)
      return
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
    const eventPlan = tusPlanSuccessEvent({
      hasHook: typeof this.options.onSuccess === 'function',
      hasSource: this._source != null,
      removeFingerprintOnSuccess: this.options.removeFingerprintOnSuccess,
    })

    if (eventPlan.removeStoredUpload) {
      // Remove stored fingerprint and corresponding endpoint. This causes
      // new uploads of the same file to be treated as a different file.
      await this._removeFromUrlStorage()
    }

    if (eventPlan.shouldCall && typeof this.options.onSuccess === 'function') {
      this.options.onSuccess({ lastResponse })
    }

    if (eventPlan.closeSource) {
      this._source?.close()
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
  private _emitProgress(input: TusProgressEventPlanInput): void {
    const eventPlan = tusPlanProgressEvent(input)
    if (eventPlan.shouldCall && typeof this.options.onProgress === 'function') {
      this.options.onProgress(eventPlan.bytesSent, eventPlan.bytesTotal)
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
  private _emitChunkComplete(input: TusChunkCompleteEventPlanInput): void {
    const eventPlan = tusPlanChunkCompleteEvent(input)
    if (eventPlan.shouldCall && typeof this.options.onChunkComplete === 'function') {
      this.options.onChunkComplete(
        eventPlan.chunkSize,
        eventPlan.bytesAccepted,
        eventPlan.bytesTotal,
      )
    }
  }

  private async _emitUploadUrlAvailable(context: TusUploadUrlAvailableHookContext): Promise<void> {
    const hookPlan = tusPlanUploadUrlAvailableHook({
      context,
      hasHook: typeof this.options.onUploadUrlAvailable === 'function',
    })

    if (hookPlan.shouldCall && typeof this.options.onUploadUrlAvailable === 'function') {
      await this.options.onUploadUrlAvailable()
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
    const creationRequestPlan = tusPlanUploadCreationRequest({
      endpoint: this.options.endpoint,
      size: this._size,
      uploadDataDuringCreation: this.options.uploadDataDuringCreation,
      uploadLengthDeferred: this._uploadLengthDeferred,
    })
    if (!creationRequestPlan.ok) {
      throw new Error(creationRequestPlan.message)
    }

    const req = this._openRequest(
      tusCreateUploadRequestPlan({
        endpoint: creationRequestPlan.endpoint,
        metadata: this.options.metadata,
        protocol: this.options.protocol,
        size: this._size,
        uploadComplete: creationRequestPlan.uploadComplete,
        uploadLengthDeferred: this._uploadLengthDeferred,
      }),
    )

    let res: HttpResponse
    try {
      if (
        tusShouldSendUploadBodyDuringCreation({
          uploadDataDuringCreation: this.options.uploadDataDuringCreation,
          uploadLengthDeferred: this._uploadLengthDeferred,
        })
      ) {
        this._offset = 0
        res = await this._addChunkToRequest(req)
      } else {
        res = await this._sendRequest(req)
      }
    } catch (err) {
      if (!(err instanceof Error)) {
        throw new Error(tusNonErrorThrownValueMessage({ value: err }))
      }

      throw new DetailedError(creationRequestPlan.requestErrorMessage, err, req, undefined)
    }

    const creationResponsePlan = tusPlanUploadCreationResponse({
      followUp: 'patchIfNonempty',
      response: tusReadUploadCreationResponse({
        getHeader: (headerName) => res.getHeader(headerName),
        status: res.getStatus(),
      }),
      size: this._size,
    })
    if (creationResponsePlan.action === 'fail') {
      throw new DetailedError(creationResponsePlan.message, undefined, req, res)
    }

    this.url = tusResolveUploadLocation({
      location: creationResponsePlan.location,
      requestUrl: creationRequestPlan.endpoint,
    })
    log(tusPlanCreatedUploadLog({ uploadUrl: this.url }).message)

    await this._emitUploadUrlAvailable('createUpload')

    if (creationResponsePlan.action === 'complete') {
      // Nothing to upload and file was successfully created
      await this._emitSuccess(res)
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
    const resumeRequestPlan = tusPlanResumeUploadRequest({
      uploadUrl: this.url,
    })
    if (!resumeRequestPlan.ok) {
      throw new Error(resumeRequestPlan.message)
    }
    const req = this._openRequest(
      tusGetUploadOffsetRequestPlan({
        protocol: this.options.protocol,
        uploadUrl: resumeRequestPlan.uploadUrl,
      }),
    )

    let res: HttpResponse
    try {
      res = await this._sendRequest(req)
    } catch (err) {
      if (!(err instanceof Error)) {
        throw new Error(tusNonErrorThrownValueMessage({ value: err }))
      }

      throw new DetailedError(resumeRequestPlan.requestErrorMessage, err, req, undefined)
    }

    const status = res.getStatus()
    const responseStatusPlan = tusPlanResumeResponseStatus({
      hasEndpoint: this.options.endpoint != null,
      status,
    })
    if (responseStatusPlan.action !== 'readOffset') {
      if (responseStatusPlan.removeStoredUpload) {
        await this._removeFromUrlStorage()
      }

      if (responseStatusPlan.action === 'fail') {
        throw new DetailedError(responseStatusPlan.message, undefined, req, res)
      }

      this.url = null
      await this._createUpload()
      return
    }

    const offsetResponse = tusReadUploadOffsetResponse({
      getHeader: (headerName) => res.getHeader(headerName),
      protocol: this.options.protocol,
      status,
    })
    const offsetResponsePlan = tusPlanResumeOffsetResponse({
      response: offsetResponse,
    })
    if (offsetResponsePlan.action === 'fail') {
      throw new DetailedError(offsetResponsePlan.message, undefined, req, res)
    }

    const offset = offsetResponsePlan.offset
    const length = offsetResponsePlan.length
    this._uploadLengthDeferred = offsetResponsePlan.uploadLengthDeferred

    await this._emitUploadUrlAvailable('resumeUpload')

    await this._saveUploadInUrlStorage()

    // Upload has already been completed and we do not need to send additional
    // data to the server
    const completionPlan = tusPlanUploadCompletionAfterOffset({ length, offset })
    if (completionPlan.complete) {
      this._emitProgress({
        hasHook: typeof this.options.onProgress === 'function',
        phase: 'afterResumeAlreadyComplete',
        uploadLength: completionPlan.length,
      })
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

    const chunkRequestPlan = tusPlanUploadChunkRequest({
      offset: this._offset,
      uploadUrl: this.url,
    })
    if (!chunkRequestPlan.ok) {
      throw new Error(chunkRequestPlan.message)
    }
    req = this._openRequest(
      tusPatchUploadRequestPlan({
        offset: this._offset,
        overridePatchMethod: this.options.overridePatchMethod,
        protocol: this.options.protocol,
        uploadUrl: chunkRequestPlan.uploadUrl,
      }),
    )

    let res: HttpResponse
    try {
      res = await this._addChunkToRequest(req)
    } catch (err) {
      // Don't emit an error if the upload was aborted manually
      if (this._aborted) {
        return
      }

      if (!(err instanceof Error)) {
        throw new Error(tusNonErrorThrownValueMessage({ value: err }))
      }

      throw new DetailedError(chunkRequestPlan.requestErrorMessage, err, req, undefined)
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
    const end = tusChunkEnd({
      chunkSize: this.options.chunkSize,
      offset: this._offset,
      size: this._size,
      uploadLengthDeferred: this._uploadLengthDeferred,
    })

    req.setProgressHandler((bytesSent) => {
      this._emitProgress({
        bytesTotal: this._size,
        hasHook: typeof this.options.onProgress === 'function',
        phase: 'duringRequest',
        startOffset: start,
        transmittedBytes: bytesSent,
      })
    })

    // TODO: What happens if abort is called during slice?
    // @ts-expect-error _source is set here
    const { value, size, done } = await this._source.slice(start, end)
    const sizeOfValue = size ?? 0

    const deferredLengthPlan = tusDeferredUploadLengthPlan({
      done,
      offset: this._offset,
      uploadLengthDeferred: this._uploadLengthDeferred,
      valueSize: sizeOfValue,
    })
    if (deferredLengthPlan.shouldDeclareLength) {
      this._size = deferredLengthPlan.size
      setRequestHeaders(req, tusUploadLengthHeaders({ size: this._size }))
      this._uploadLengthDeferred = false
    }

    setRequestHeaders(req, tusUploadBodyHeaders({ done, protocol: this.options.protocol }))

    // The specified uploadSize might not match the actual amount of data that a source
    // provides. In these cases, we cannot successfully complete the upload, so we
    // rather error out and let the user know. If not, tus-js-client will be stuck
    // in a loop of repeating empty PATCH requests.
    // See https://community.transloadit.com/t/how-to-abort-hanging-companion-uploads/16488/13
    const newSize = this._offset + sizeOfValue
    const sizeCheck = tusCheckConfiguredUploadSize({
      done,
      newSize,
      size: this._size,
      uploadLengthDeferred: this._uploadLengthDeferred,
    })
    if (!sizeCheck.ok) {
      throw new Error(sizeCheck.message)
    }

    if (value == null) {
      return await this._sendRequest(req)
    }

    this._emitProgress({
      bytesTotal: this._size,
      currentOffset: this._offset,
      hasHook: typeof this.options.onProgress === 'function',
      phase: 'beforeRequestBody',
    })
    return await this._sendRequest(req, value)
  }

  /**
   * _handleUploadResponse is used by requests that haven been sent using _addChunkToRequest
   * and already have received a response.
   *
   * @api private
   */
  private async _handleUploadResponse(req: HttpRequest, res: HttpResponse): Promise<void> {
    const chunkResponsePlan = tusPlanUploadChunkResponse({
      currentOffset: this._offset,
      response: tusReadUploadChunkResponse({
        getHeader: (headerName) => res.getHeader(headerName),
        status: res.getStatus(),
      }),
      size: this._size,
    })
    if (chunkResponsePlan.action === 'fail') {
      throw new DetailedError(chunkResponsePlan.message, undefined, req, res)
    }

    this._emitProgress({
      bytesTotal: this._size,
      hasHook: typeof this.options.onProgress === 'function',
      phase: 'afterChunkAccepted',
      uploadOffset: chunkResponsePlan.offset,
    })
    this._emitChunkComplete({
      bytesAccepted: chunkResponsePlan.offset,
      bytesTotal: this._size,
      chunkSize: chunkResponsePlan.chunkSize,
      hasHook: typeof this.options.onChunkComplete === 'function',
      phase: 'afterChunkAccepted',
    })

    this._offset = chunkResponsePlan.offset

    if (chunkResponsePlan.action === 'complete') {
      // Yay, finally done :)
      await this._emitSuccess(res)
      return
    }

    await this._performUpload()
  }

  /**
   * Create a new HTTP request object with the given method and URL.
   *
   * @api private
   */
  private _openRequest(plan: TusRequestPlan): HttpRequest {
    const req = openRequest(plan, this.options)
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
    const storagePlan = tusPlanUploadStorage({
      fingerprint: this._fingerprint,
      hasUrlStorageKey: this._urlStorageKey != null,
      storeFingerprintForResuming: this.options.storeFingerprintForResuming,
    })

    // We do not store the upload URL
    // - if it was disabled in the option, or
    // - if no fingerprint was calculated for the input (i.e. a stream), or
    // - if the URL is already stored (i.e. key is set already).
    if (!storagePlan.shouldStore) {
      return
    }

    const recordPlan = tusPlanStoredUploadRecord({
      creationTime: tusUrlStorageCreationTime({ now: new Date() }),
      fingerprint: storagePlan.fingerprint,
      metadata: this.options.metadata,
      parallelUploadUrls: this._parallelUploadUrls,
      size: this._size,
      uploadUrl: this.url,
      useParallelUploadUrls: this._parallelUploads != null,
    })
    if (!recordPlan.ok) {
      throw new Error(recordPlan.message)
    }

    const urlStorageKey = await this.options.urlStorage.addUpload(
      storagePlan.fingerprint,
      recordPlan.upload,
    )
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

function setRequestHeaders(req: HttpRequest, headers: Record<string, string>): void {
  for (const [name, value] of Object.entries(headers)) {
    req.setHeader(name, value)
  }
}

/**
 * Create a new HTTP request with the specified method and URL.
 * The necessary headers that are included in every request
 * will be added, including the request ID.
 *
 * @api private
 */
function openRequest(plan: TusRequestPlan, options: UploadOptions): HttpRequest {
  const req = options.httpStack.createRequest(plan.method, plan.url)
  const requestId = tusPlanRequestId({
    addRequestId: options.addRequestId,
    generateRequestId: uuid,
  })

  setRequestHeaders(
    req,
    tusPlanRequestHeaders({
      addRequestId: options.addRequestId,
      customHeaders: options.headers || {},
      operationHeaders: plan.headers,
      requestId,
    }),
  )

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
  const lifecyclePlan = tusPlanRequestLifecycleHooks({
    hasAfterResponseHook: typeof options.onAfterResponse === 'function',
    hasBeforeRequestHook: typeof options.onBeforeRequest === 'function',
  })

  if (lifecyclePlan.beforeRequestHook && typeof options.onBeforeRequest === 'function') {
    await options.onBeforeRequest(req)
  }

  const res = await req.send(body)

  if (lifecyclePlan.afterResponseHook && typeof options.onAfterResponse === 'function') {
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
  // Note: We don't reference `window` here because the navigator object also exists
  // in a Web Worker's context.
  // -disable-next-line no-undef
  const platformOnline = typeof navigator !== 'undefined' ? navigator.onLine : undefined
  return tusDefaultRetryOnlineStatus({ platformOnline })
}

/**
 * Extract errors that originated from a request. Only these can safely be retried.
 */
function getRetryableError(err: Error): DetailedError | null {
  if (
    err instanceof DetailedError &&
    tusShouldTreatRequestErrorAsRetryable({ hasRequestContext: err.originalRequest != null })
  ) {
    return err
  }

  return null
}

function shouldRetryByPolicy(
  err: DetailedError,
  retryAttempt: number,
  options: UploadOptions,
): boolean {
  if (
    tusShouldUseCustomRetryPolicy({
      hasCustomRetryPolicy: typeof options.onShouldRetry === 'function',
    }) &&
    typeof options.onShouldRetry === 'function'
  ) {
    return options.onShouldRetry(err, retryAttempt, options)
  }

  return defaultOnShouldRetry(err)
}

/**
 * determines if the request should be retried.
 * @param {DetailedError} err
 * @returns {boolean}
 */
function defaultOnShouldRetry(err: DetailedError): boolean {
  const status = err.originalResponse ? err.originalResponse.getStatus() : 0
  return tusDefaultRetryPolicyDecision({ isOnline: isOnline(), status })
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
  const terminateRequestPlan = tusPlanTerminateUploadRequest({ uploadUrl: url })
  const plan = tusTerminateUploadRequestPlan({
    protocol: options.protocol,
    uploadUrl: terminateRequestPlan.uploadUrl,
  })
  const req = openRequest(plan, options)

  try {
    const res = await sendRequest(req, undefined, options)
    const responsePlan = tusPlanTerminateResponse({ status: res.getStatus() })
    if (responsePlan.action === 'complete') {
      return
    }

    throw new DetailedError(responsePlan.message, undefined, req, res)
  } catch (err) {
    if (!(err instanceof Error)) {
      throw new Error(tusNonErrorThrownValueMessage({ value: err }))
    }

    const detailedErr =
      err instanceof DetailedError
        ? err
        : new DetailedError(terminateRequestPlan.requestErrorMessage, err, req)

    const retryableErr = getRetryableError(detailedErr)
    const retryDelays = options.retryDelays ?? null
    let retryPlan = tusPlanRetryAfterError({
      isNetworkError: retryableErr != null,
      offset: 0,
      offsetBeforeRetry: 0,
      retryAttempt: 0,
      retryDelays,
    })

    if (
      tusShouldEvaluateRetryPolicy({
        hasRetryableError: retryableErr != null,
        retryPlanAction: retryPlan.action,
      }) &&
      retryableErr != null
    ) {
      retryPlan = tusPlanRetryAfterError({
        isNetworkError: true,
        offset: 0,
        offsetBeforeRetry: 0,
        retryAttempt: retryPlan.retryAttempt,
        retryDelays,
        shouldRetry: shouldRetryByPolicy(retryableErr, retryPlan.retryAttempt, options),
      })
    }

    if (retryPlan.action !== 'scheduleRetry') {
      throw detailedErr
    }

    const newOptions = {
      ...options,
      retryDelays: retryPlan.remainingRetryDelays,
    }

    await wait(retryPlan.delay)
    await terminate(url, newOptions)
  }
}
