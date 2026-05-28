// This file is generated from Transloadit API2 TUS protocol contracts. If it looks wrong,
// please report the issue instead of editing this file by hand; the source fix
// belongs in the protocol contract generator so all TUS clients stay in sync.

export const TUS_DEFAULT_PROTOCOL_VERSION = '1.0.0'

export const TUS_DEFAULT_CLIENT_PROTOCOL = 'tus-v1'

export const PROTOCOL_TUS_V1 = 'tus-v1'
export const PROTOCOL_IETF_DRAFT_03 = 'ietf-draft-03'
export const PROTOCOL_IETF_DRAFT_05 = 'ietf-draft-05'

export type TusClientProtocol =
  | typeof PROTOCOL_TUS_V1
  | typeof PROTOCOL_IETF_DRAFT_03
  | typeof PROTOCOL_IETF_DRAFT_05

export const TUS_HTTP_METHODS = {
  DELETE: 'DELETE',
  GET: 'GET',
  HEAD: 'HEAD',
  OPTIONS: 'OPTIONS',
  PATCH: 'PATCH',
  POST: 'POST',
} as const

export const TUS_OPERATION_METHODS = {
  DISCOVER_TUS_CAPABILITIES: 'OPTIONS',
  CREATE_TUS_UPLOAD: 'POST',
  GET_TUS_UPLOAD_OFFSET: 'HEAD',
  PATCH_TUS_UPLOAD: 'PATCH',
  TERMINATE_TUS_UPLOAD: 'DELETE',
  DOWNLOAD_TUS_UPLOAD: 'GET',
} as const

export const TUS_OPERATION_METHOD_BY_ID: Record<string, string> = {
  discoverTusCapabilities: 'OPTIONS',
  createTusUpload: 'POST',
  getTusUploadOffset: 'HEAD',
  patchTusUpload: 'PATCH',
  terminateTusUpload: 'DELETE',
  downloadTusUpload: 'GET',
}

export const TUS_OPERATION_IDS = {
  DISCOVER_TUS_CAPABILITIES: 'discoverTusCapabilities',
  CREATE_TUS_UPLOAD: 'createTusUpload',
  GET_TUS_UPLOAD_OFFSET: 'getTusUploadOffset',
  PATCH_TUS_UPLOAD: 'patchTusUpload',
  TERMINATE_TUS_UPLOAD: 'terminateTusUpload',
  DOWNLOAD_TUS_UPLOAD: 'downloadTusUpload',
} as const

export const TUS_HEADERS = {
  CONTENT_TYPE: 'Content-Type',
  LOCATION: 'Location',
  TUS_EXTENSION: 'Tus-Extension',
  TUS_MAX_SIZE: 'Tus-Max-Size',
  TUS_RESUMABLE: 'Tus-Resumable',
  TUS_VERSION: 'Tus-Version',
  UPLOAD_COMPLETE: 'Upload-Complete',
  UPLOAD_CONCAT: 'Upload-Concat',
  UPLOAD_DEFER_LENGTH: 'Upload-Defer-Length',
  UPLOAD_DRAFT_INTEROP_VERSION: 'Upload-Draft-Interop-Version',
  UPLOAD_LENGTH: 'Upload-Length',
  UPLOAD_METADATA: 'Upload-Metadata',
  UPLOAD_OFFSET: 'Upload-Offset',
  X_HTTP_METHOD_OVERRIDE: 'X-HTTP-Method-Override',
  X_REQUEST_ID: 'X-Request-ID',
} as const

export const TUS_CONTENT_TYPES = {
  APPLICATION_OFFSET_OCTET_STREAM: 'application/offset+octet-stream',
  APPLICATION_PARTIAL_UPLOAD: 'application/partial-upload',
} as const

export const TUS_REQUEST_CONTENT_TYPES = {
  PATCH_TUS_UPLOAD: 'application/offset+octet-stream',
} as const

export const TUS_RESPONSE_STATUS_CODES = {
  DISCOVER_TUS_CAPABILITIES_200: 200,
  CREATE_TUS_UPLOAD_201: 201,
  GET_TUS_UPLOAD_OFFSET_200: 200,
  PATCH_TUS_UPLOAD_204: 204,
  TERMINATE_TUS_UPLOAD_204: 204,
  DOWNLOAD_TUS_UPLOAD_200: 200,
} as const

export const TUS_OPERATION_RESPONSE_STATUS_CODES: Record<string, readonly number[]> = {
  discoverTusCapabilities: [200],
  createTusUpload: [201],
  getTusUploadOffset: [200],
  patchTusUpload: [204],
  terminateTusUpload: [204],
  downloadTusUpload: [200],
}

export const TUS_SUPPORTED_PROTOCOLS: readonly string[] = [
  'tus-v1',
  'ietf-draft-03',
  'ietf-draft-05',
]

export const TUS_PROTOCOLS_REQUIRING_KNOWN_UPLOAD_LENGTH_ON_OFFSET_RESPONSE: readonly string[] = [
  'tus-v1',
]

export const TUS_PROTOCOL_REQUEST_HEADERS: Record<string, Record<string, string>> = {
  'tus-v1': {
    'Tus-Resumable': '1.0.0',
  },
  'ietf-draft-03': {
    'Upload-Draft-Interop-Version': '5',
  },
  'ietf-draft-05': {
    'Upload-Draft-Interop-Version': '6',
  },
}

export const TUS_PROTOCOL_UPLOAD_BODY_CONTENT_TYPES: Record<string, string> = {
  'ietf-draft-05': 'application/partial-upload',
  'tus-v1': 'application/offset+octet-stream',
}

export const TUS_PROTOCOL_UPLOAD_COMPLETE_HEADERS: Record<
  string,
  { completeValue: string; incompleteValue: string; name: string }
> = {
  'ietf-draft-03': {
    completeValue: '?1',
    incompleteValue: '?0',
    name: 'Upload-Complete',
  },
  'ietf-draft-05': {
    completeValue: '?1',
    incompleteValue: '?0',
    name: 'Upload-Complete',
  },
}

export const TUS_CONCATENATION = {
  finalPrefix: 'final;',
  headerName: 'Upload-Concat',
  partialValue: 'partial',
  uploadUrlSeparator: ' ',
}

export const TUS_METADATA_ENCODING = {
  entrySeparator: ',',
  keyValueSeparator: ' ',
  valueEncoding: 'base64',
}

export const TUS_METHOD_OVERRIDES: Record<
  string,
  { headers: Record<string, string>; method: string }
> = {
  patchTusUpload: {
    headers: {
      'X-HTTP-Method-Override': 'PATCH',
    },
    method: 'POST',
  },
}

export const TUS_REQUEST_ID_HEADER_NAME = 'X-Request-ID'

export const TUS_RETRY_POLICY = {
  clientErrorStatusCategory: 400,
  lockedStatusCode: 423,
  retryableClientStatusCodes: [409, 423],
  successStatusCategory: 200,
}

export const TUS_UPLOAD_BODY = {
  contentTypeHeaderName: 'Content-Type',
}

export const TUS_FLOW_POLICY = {
  abort: {
    error: {
      message: 'Request was aborted',
      name: 'AbortError',
      type: 'DOMException',
    },
    removeStoredUrlAfterTermination: 'after-successful-termination',
    sequence: [
      'mark-aborted',
      'abort-parallel-uploads',
      'abort-current-request',
      'clear-retry-timer',
      'terminate-upload-if-requested',
    ],
    terminateUpload: 'when-requested-and-upload-url-known',
  },
  eventHooks: {
    uploadUrlAvailable: {
      createUpload: 'after-url-known-before-storage',
      parallelFinalUpload: 'not-emitted',
      resumeUpload: 'after-url-known-before-storage',
    },
  },
  fileSources: {
    commonTypes: [
      'File',
      'Blob',
      'ArrayBuffer',
      'SharedArrayBuffer',
      'ArrayBufferView',
      'ReadableStream (Web Streams)',
    ],
    messages: {
      nodeStreamBackwardsRead: 'cannot slice from position which we already seeked away',
      nodeStreamChunkSizeRequired:
        'cannot create source for stream without a finite value for the `chunkSize` option; specify a chunkSize to control the memory consumption',
      nodeStreamStartOutsideBuffer: 'slice start is outside of buffer (currently not implemented)',
      unsupportedSourceType:
        'in this environment the source object may only be an instance of: {supportedTypes}',
      webStreamAlreadyLocked:
        'Readable stream is already locked to reader. tus-js-client cannot obtain a new reader.',
      webStreamBackwardsRead: "Requested data is before the reader's current offset",
      webStreamChunkSizeRequired:
        'cannot create source for stream without a finite value for the `chunkSize` option',
      webStreamMissingBuffer: 'cannot _getDataFromBuffer because _buffer is unset',
      webStreamUnknownDataType: 'Unknown data type',
    },
    nodeExtraTypes: ['fs.ReadStream (Node.js)', 'stream.Readable (Node.js)'],
  },
  httpStacks: {
    browserStackNodeReadableBody: 'unsupported',
    messages: {
      browserStackNodeReadableBodyUnsupported:
        'Using a Node.js readable stream as HTTP request body is not supported using the {stackName} HTTP stack.',
      nodeStackMissingStatusCode: 'no status code available yet',
      nodeStackUnsupportedBodyType:
        'Unsupported HTTP request body type in Node.js HTTP stack: {bodyType} (constructor: {constructorName})',
    },
    nodeStackMissingStatusCode: 'throw',
    nodeStackUnsupportedBodyType: 'throw',
  },
  locationResolution: {
    strategy: 'relative-to-creation-request-url',
  },
  messages: {
    configuredUploadSizeMismatch:
      'upload was configured with a size of {expectedSize} bytes, but the source is done after {actualSize} bytes',
    cannotDeriveUploadSize:
      "tus: cannot automatically derive upload's size from input. Specify it manually using the `uploadSize` option or use the `uploadLengthDeferred` option",
    createMissingEndpoint: 'tus: unable to create upload because no endpoint is provided',
    createMissingSize: 'tus: expected _size to be set',
    createUploadRequestFailed: 'tus: failed to create upload',
    createdUpload: 'Created upload at {uploadUrl}',
    finalUploadMissingPartialUrls: 'tus: Expected _parallelUploadUrls to be set',
    finalUploadRequestFailed: 'tus: failed to concatenate parallel uploads',
    fingerprintCalculated: 'Calculated fingerprint: {fingerprint}',
    fingerprintUnavailable: 'tus: unable to calculate fingerprint for this input file',
    fingerprintUnavailableForStorage:
      'No fingerprint was calculated meaning that the upload cannot be stored in the URL storage.',
    invalidUploadSize: 'tus: cannot convert `uploadSize` option into a number',
    invalidChunkOffset: 'tus: invalid or missing offset value',
    invalidResumeLength: 'tus: invalid or missing length value',
    invalidResumeOffset: 'tus: invalid Upload-Offset header',
    lockedUpload: 'tus: upload is currently locked; retry later',
    nonErrorThrownValue: 'tus: value thrown that is not an error: {value}',
    missingEndpointOrUploadUrl: 'tus: neither an endpoint or an upload URL is provided',
    missingInput: 'tus: no file or stream to upload provided',
    missingPatchUrl: 'tus: Expected url to be set',
    missingResumeOffset: 'tus: missing Upload-Offset header',
    removedResumeOption:
      'tus: The `resume` option has been removed in tus-js-client v2. Please use the URL storage API instead.',
    parallelBoundariesLengthMismatch:
      'tus: the `parallelUploadBoundaries` must have the same length as the value of `parallelUploads`',
    parallelBoundariesWithoutParallelUploads:
      'tus: cannot use the `parallelUploadBoundaries` option when `parallelUploads` is disabled',
    parallelUploadMissingSize: 'tus: Expected _size to be set',
    parallelUploadsWithDeferredLength:
      'tus: cannot use the `uploadLengthDeferred` option when parallelUploads is enabled',
    parallelUploadsWithUploadSize:
      'tus: cannot use the `uploadSize` option when parallelUploads is enabled',
    parallelUploadsWithUploadUrl:
      'tus: cannot use the `uploadUrl` option when parallelUploads is enabled',
    parallelUploadSliceMissingValue:
      'tus: no value returned while slicing file for parallel uploads',
    reactNativeUriBlobFetchFailed:
      'tus: cannot fetch `file.uri` as Blob, make sure the uri is correct and accessible. {error}',
    reactNativeUriUnsupported:
      'tus: file objects with `uri` property is only supported in React Native',
    resumeUploadRequestFailed: 'tus: failed to resume upload',
    resumeWithoutEndpoint:
      'tus: unable to resume upload (new upload cannot be created without an endpoint)',
    retryDelaysNotArray: 'tus: the `retryDelays` option must either be an array or null',
    storageMissingParallelUploadUrls:
      'tus: cannot store parallel upload because no partial upload URLs are available',
    storageMissingUploadUrl: 'tus: cannot store upload because no upload URL is available',
    terminateUploadRequestFailed: 'tus: failed to terminate upload',
    unexpectedChunkResponse: 'tus: unexpected response while uploading chunk',
    unexpectedCreateResponse: 'tus: unexpected response while creating upload',
    unexpectedResumeResponse: 'tus: unexpected response while resuming upload',
    unexpectedTerminateResponse: 'tus: unexpected response while terminating upload',
    uploadChunkRequestFailed: 'tus: failed to upload chunk at offset {offset}',
    uploadLocationMissing: 'tus: invalid or missing Location header',
    unsupportedProtocolPrefix: 'tus: unsupported protocol ',
  },
  minimumParallelUploads: 2,
  optionDefaults: {
    addRequestId: false,
    chunkSize: {
      kind: 'unbounded',
    },
    headers: {},
    metadata: {},
    metadataForPartialUploads: {},
    overridePatchMethod: false,
    parallelUploads: 1,
    removeFingerprintOnSuccess: false,
    retryDelays: [0, 1000, 3000, 5000],
    storeFingerprintForResuming: true,
    uploadDataDuringCreation: false,
    uploadLengthDeferred: false,
  },
  parallelPartialUpload: {
    headerKind: 'partial-upload',
    metadataSource: 'metadataForPartialUploads',
    nestedParallelUploads: 'disabled',
    urlStorage: 'parent-managed',
  },
  parallelUploadSplit: {
    strategy: 'contiguous-floor-size-last-remainder',
  },
  requestHeaders: {
    layers: ['operation', 'custom', 'request-id'],
    requestIdSource: 'sdk-generated-uuid',
  },
  requestLifecycle: {
    hooks: {
      afterResponse: 'after-successful-transport-response',
      beforeRequest: 'before-transport-send',
    },
    retry: {
      customDecision: 'custom-callback-before-default-decision',
      defaultDecision: 'retryable-status-and-online',
      evaluationTrigger: 'generated-plan-evaluate-policy',
      onlineSignal: 'sdk-platform-online-status',
      timer: 'sdk-platform-timer',
    },
  },
  urlStorage: {
    id: {
      multiplier: 1000000000000,
      strategy: 'rounded-random-number',
    },
    messages: {
      missingItem: "didn't find item for key {key}",
      missingKey: "didn't find key for item {index}",
    },
    namespace: 'tus',
    record: {
      creationTime: 'sdk-current-date-string',
      missingUrl: 'fail',
      storedUrlKind: 'single-or-parallel-upload-url',
    },
    removeOnSuccess: 'when-option-enabled',
    separator: '::',
    webStorage: {
      malformedEntry: 'ignore',
      probeKey: 'tusSupport',
      unavailableDomExceptionNames: ['QuotaExceededError', 'SecurityError'],
    },
  },
}

export type TusNumericHeaderReadResult =
  | { ok: false; reason: 'invalid' | 'missing' }
  | { ok: true; value: number }

export interface TusRequestPlan {
  headers: Record<string, string>
  method: string
  operationId: string
  url: string
}

export type TusUploadCreationResponseReadResult =
  | { ok: false; reason: 'missingLocation' | 'unexpectedStatus' }
  | { ok: true; location: string }

export type TusUploadOffsetResponseReadResult =
  | { ok: false; reason: 'invalidLength' | 'invalidOffset' | 'missingOffset' | 'unexpectedStatus' }
  | { ok: true; length: number | null; offset: number; uploadLengthDeferred: boolean }

export type TusUploadChunkResponseReadResult =
  | { ok: false; reason: 'invalidOffset' | 'missingOffset' | 'unexpectedStatus' }
  | { ok: true; offset: number }

export type TusUploadStartValidationReason =
  | 'missingInput'
  | 'unsupportedProtocol'
  | 'missingEndpointOrUploadUrl'
  | 'retryDelaysNotArray'
  | 'parallelUploadsWithUploadUrl'
  | 'parallelUploadsWithUploadSize'
  | 'parallelUploadsWithDeferredLength'
  | 'parallelBoundariesWithoutParallelUploads'
  | 'parallelBoundariesLengthMismatch'

export type TusUploadStartValidationResult =
  | { ok: false; message: string; reason: TusUploadStartValidationReason }
  | { ok: true }

export interface TusUploadStartValidationInput {
  hasCurrentUrl: boolean
  hasEndpoint: boolean
  hasFile: boolean
  hasUploadSize: boolean
  hasUploadUrl: boolean
  parallelUploadBoundariesCount: number | null
  parallelUploads: number
  protocol: string
  retryDelays: unknown
  uploadLengthDeferred: boolean
}

export type TusSingleUploadStartPlan =
  | { action: 'create'; logMessage: string }
  | { action: 'resumeCurrent'; logMessage: string; url: string }
  | { action: 'resumeConfigured'; logMessage: string; url: string }

export type TusResumeResponseStatusPlan =
  | { action: 'create'; removeStoredUpload: boolean }
  | {
      action: 'fail'
      message: string
      reason: 'locked' | 'resumeWithoutEndpoint'
      removeStoredUpload: boolean
    }
  | { action: 'readOffset' }

export type TusResumeOffsetResponsePlan =
  | {
      action: 'continue'
      length: number | null
      offset: number
      uploadLengthDeferred: boolean
    }
  | {
      action: 'fail'
      message: string
      reason: 'invalidLength' | 'invalidOffset' | 'missingOffset' | 'unexpectedStatus'
    }

export type TusResumeUploadRequestPlan =
  | { ok: false; message: string; reason: 'missingUploadUrl' }
  | { ok: true; requestErrorMessage: string; uploadUrl: string }

export type TusFingerprintPlan =
  | { ok: false; message: string; reason: 'missingFingerprint' }
  | { fingerprint: string; ok: true }

export type TusParallelUploadSlicePlan =
  | { ok: false; message: string; reason: 'missingValue' }
  | { ok: true }

export type TusUploadChunkRequestPlan =
  | { ok: false; message: string; reason: 'missingUploadUrl' }
  | { ok: true; requestErrorMessage: string; uploadUrl: string }

export interface TusTerminateUploadRequestPlan {
  requestErrorMessage: string
  uploadUrl: string
}

export type TusCreateUploadValidationResult =
  | { ok: false; message: string; reason: 'missingEndpoint' | 'missingSize' }
  | { ok: true }

export type TusUploadCreationRequestPlan =
  | { ok: false; message: string; reason: 'missingEndpoint' | 'missingSize' }
  | {
      endpoint: string
      ok: true
      requestErrorMessage: string
      uploadComplete: boolean | undefined
    }

export type TusPreparedUploadSizePlan =
  | { ok: false; message: string; reason: 'cannotDeriveUploadSize' | 'invalidUploadSize' }
  | { ok: true; size: number | null }

export type TusPreparedUploadModePlan = { action: 'parallel' } | { action: 'single' }

export type TusParallelUploadBoundary = { end: number; start: number }

export type TusParallelUploadPart = TusParallelUploadBoundary & { uploadUrl: string | null }

export type TusParallelUploadPartsPlan =
  | { ok: false; message: string; reason: 'missingSize' }
  | { ok: true; parts: TusParallelUploadPart[]; totalSize: number }

export interface TusParallelPartialUploadOptionsPlan {
  headers: Record<string, string>
  metadata: Record<string, string>
  parallelUploadBoundaries: null
  parallelUploads: number
  removeFingerprintOnSuccess: boolean
  storeFingerprintForResuming: boolean
  uploadUrl: string | null
}

export type TusFinalUploadCreationPlan =
  | {
      ok: false
      message: string
      reason: 'missingEndpoint' | 'missingPartialUploadUrls'
    }
  | {
      endpoint: string
      ok: true
      requestErrorMessage: string
      uploadUrls: readonly string[]
    }

export type TusDeferredUploadLengthPlan =
  | { shouldDeclareLength: false }
  | { shouldDeclareLength: true; size: number }

export type TusUploadOffsetCompletionPlan = { complete: false } | { complete: true; length: number }

export type TusConfiguredUploadSizeCheck = { ok: true } | { message: string; ok: false }

export type TusUploadStoragePlan =
  | { shouldStore: false }
  | { fingerprint: string; shouldStore: true }

export interface TusStoredUploadRecord {
  creationTime: string
  metadata: Record<string, string>
  parallelUploadUrls?: string[]
  size: number | null
  uploadUrl?: string
  urlStorageKey: string
}

export type TusStoredUploadRecordPlan =
  | { ok: false; message: string; reason: 'missingParallelUploadUrls' | 'missingUploadUrl' }
  | { ok: true; upload: TusStoredUploadRecord }

export type TusUploadCreationFollowUp = 'none' | 'patchIfNonempty'

export type TusUploadCreationResponsePlan =
  | { action: 'complete'; location: string }
  | { action: 'continue'; location: string }
  | { action: 'fail'; message: string; reason: 'missingLocation' | 'unexpectedStatus' }

export type TusUploadChunkResponsePlan =
  | { action: 'complete'; chunkSize: number; offset: number }
  | { action: 'continue'; chunkSize: number; offset: number }
  | {
      action: 'fail'
      message: string
      reason: 'invalidOffset' | 'missingOffset' | 'unexpectedStatus'
    }

export type TusTerminateResponsePlan =
  | { action: 'complete' }
  | { action: 'fail'; message: string; reason: 'unexpectedStatus' }

export type TusRetryAfterErrorPlan =
  | { action: 'emitError'; retryAttempt: number }
  | { action: 'evaluatePolicy'; retryAttempt: number }
  | {
      action: 'retry'
      delay: number
      nextRetryAttempt: number
      offsetBeforeRetry: number
      retryAttempt: number
    }

export type TusRemovedResumeOptionWarningPlan =
  | { message: string; shouldWarn: true }
  | { shouldWarn: false }

export type TusAbortRuntimeAction =
  | { action: 'abortCurrentRequest' }
  | { action: 'abortParallelUploads'; shouldTerminate: boolean }
  | { action: 'clearRetryTimer' }
  | { action: 'markAborted' }
  | { action: 'terminateUpload'; removeStoredUpload: true; uploadUrl: string }

export interface TusAbortPlan {
  actions: TusAbortRuntimeAction[]
}

export interface TusAbortErrorDescriptor {
  message: string
  name: string
  type: 'DOMException'
}

export interface TusLogMessagePlan {
  message: string
}

export interface TusClientDefaultOptions {
  addRequestId: boolean
  chunkSize: number
  headers: Record<string, string>
  metadata: Record<string, string>
  metadataForPartialUploads: Record<string, string>
  overridePatchMethod: boolean
  parallelUploads: number
  protocol: TusClientProtocol
  removeFingerprintOnSuccess: boolean
  retryDelays: number[]
  storeFingerprintForResuming: boolean
  uploadDataDuringCreation: boolean
  uploadLengthDeferred: boolean
}

export interface TusRequestLifecycleHookPlan {
  afterResponseHook: boolean
  beforeRequestHook: boolean
}

export type TusUploadUrlAvailableHookContext =
  | 'createUpload'
  | 'parallelFinalUpload'
  | 'resumeUpload'

export interface TusUploadUrlAvailableHookPlan {
  shouldCall: boolean
}

export type TusFileSourceChunkSizeValidationResult =
  | { chunkSize: number; ok: true }
  | { message: string; ok: false; reason: 'missingFiniteChunkSize' }

function tusFormatFlowMessage(template: string, values: Record<string, string | number>): string {
  let message = template
  for (const [name, value] of Object.entries(values)) {
    message = message.split(`{${name}}`).join(String(value))
  }

  return message
}

function tusUploadStartValidationError(
  reason: TusUploadStartValidationReason,
  message: string,
): TusUploadStartValidationResult {
  return { ok: false, message, reason }
}

export function tusValidateUploadStart({
  hasCurrentUrl,
  hasEndpoint,
  hasFile,
  hasUploadSize,
  hasUploadUrl,
  parallelUploadBoundariesCount,
  parallelUploads,
  protocol,
  retryDelays,
  uploadLengthDeferred,
}: TusUploadStartValidationInput): TusUploadStartValidationResult {
  if (!hasFile) {
    return tusUploadStartValidationError('missingInput', TUS_FLOW_POLICY.messages.missingInput)
  }

  if (!tusSupportsProtocol(protocol)) {
    return tusUploadStartValidationError(
      'unsupportedProtocol',
      `${TUS_FLOW_POLICY.messages.unsupportedProtocolPrefix}${protocol}`,
    )
  }

  if (!hasEndpoint && !hasUploadUrl && !hasCurrentUrl) {
    return tusUploadStartValidationError(
      'missingEndpointOrUploadUrl',
      TUS_FLOW_POLICY.messages.missingEndpointOrUploadUrl,
    )
  }

  if (retryDelays != null && !Array.isArray(retryDelays)) {
    return tusUploadStartValidationError(
      'retryDelaysNotArray',
      TUS_FLOW_POLICY.messages.retryDelaysNotArray,
    )
  }

  if (parallelUploads >= TUS_FLOW_POLICY.minimumParallelUploads) {
    if (hasUploadUrl) {
      return tusUploadStartValidationError(
        'parallelUploadsWithUploadUrl',
        TUS_FLOW_POLICY.messages.parallelUploadsWithUploadUrl,
      )
    }

    if (hasUploadSize) {
      return tusUploadStartValidationError(
        'parallelUploadsWithUploadSize',
        TUS_FLOW_POLICY.messages.parallelUploadsWithUploadSize,
      )
    }

    if (uploadLengthDeferred) {
      return tusUploadStartValidationError(
        'parallelUploadsWithDeferredLength',
        TUS_FLOW_POLICY.messages.parallelUploadsWithDeferredLength,
      )
    }
  }

  if (parallelUploadBoundariesCount != null) {
    if (parallelUploads < TUS_FLOW_POLICY.minimumParallelUploads) {
      return tusUploadStartValidationError(
        'parallelBoundariesWithoutParallelUploads',
        TUS_FLOW_POLICY.messages.parallelBoundariesWithoutParallelUploads,
      )
    }

    if (parallelUploads !== parallelUploadBoundariesCount) {
      return tusUploadStartValidationError(
        'parallelBoundariesLengthMismatch',
        TUS_FLOW_POLICY.messages.parallelBoundariesLengthMismatch,
      )
    }
  }

  return { ok: true }
}

export function tusPlanRemovedResumeOptionWarning({
  hasResumeOption,
}: {
  hasResumeOption: boolean
}): TusRemovedResumeOptionWarningPlan {
  if (!hasResumeOption) {
    return { shouldWarn: false }
  }

  return {
    message: TUS_FLOW_POLICY.messages.removedResumeOption,
    shouldWarn: true,
  }
}

export function tusPlanPreparedFingerprintLog({
  fingerprint,
}: {
  fingerprint: string | null
}): TusLogMessagePlan {
  if (fingerprint == null) {
    return { message: TUS_FLOW_POLICY.messages.fingerprintUnavailableForStorage }
  }

  return {
    message: tusFormatFlowMessage(TUS_FLOW_POLICY.messages.fingerprintCalculated, {
      fingerprint,
    }),
  }
}

export function tusPlanCreatedUploadLog({ uploadUrl }: { uploadUrl: string }): TusLogMessagePlan {
  return {
    message: tusFormatFlowMessage(TUS_FLOW_POLICY.messages.createdUpload, {
      uploadUrl,
    }),
  }
}

export function tusNonErrorThrownValueMessage({ value }: { value: unknown }): string {
  return tusFormatFlowMessage(TUS_FLOW_POLICY.messages.nonErrorThrownValue, {
    value: String(value),
  })
}

export function tusReactNativeUriUnsupportedMessage(): string {
  return TUS_FLOW_POLICY.messages.reactNativeUriUnsupported
}

export function tusReactNativeUriBlobFetchFailedMessage({ error }: { error: unknown }): string {
  return tusFormatFlowMessage(TUS_FLOW_POLICY.messages.reactNativeUriBlobFetchFailed, {
    error: String(error),
  })
}

export function tusDefaultChunkSize(): number {
  const chunkSize = TUS_FLOW_POLICY.optionDefaults.chunkSize
  if (chunkSize.kind === 'unbounded') {
    return Number.POSITIVE_INFINITY
  }

  const bytes = 'value' in chunkSize ? Number(chunkSize.value) : Number.NaN
  if (chunkSize.kind === 'bytes' && Number.isFinite(bytes)) {
    return bytes
  }

  throw new Error(`tus: unsupported default chunk size policy ${JSON.stringify(chunkSize)}`)
}

export function tusDefaultRetryDelays(): number[] {
  return [...TUS_FLOW_POLICY.optionDefaults.retryDelays]
}

export function tusDefaultClientOptions(): TusClientDefaultOptions {
  const defaults = TUS_FLOW_POLICY.optionDefaults

  return {
    addRequestId: defaults.addRequestId,
    chunkSize: tusDefaultChunkSize(),
    headers: { ...defaults.headers },
    metadata: { ...defaults.metadata },
    metadataForPartialUploads: { ...defaults.metadataForPartialUploads },
    overridePatchMethod: defaults.overridePatchMethod,
    parallelUploads: defaults.parallelUploads,
    protocol: TUS_DEFAULT_CLIENT_PROTOCOL,
    removeFingerprintOnSuccess: defaults.removeFingerprintOnSuccess,
    retryDelays: tusDefaultRetryDelays(),
    storeFingerprintForResuming: defaults.storeFingerprintForResuming,
    uploadDataDuringCreation: defaults.uploadDataDuringCreation,
    uploadLengthDeferred: defaults.uploadLengthDeferred,
  }
}

export function tusPlanRequestHeaders({
  addRequestId,
  customHeaders = {},
  operationHeaders,
  requestId,
}: {
  addRequestId: boolean
  customHeaders?: Record<string, string>
  operationHeaders: Record<string, string>
  requestId?: string
}): Record<string, string> {
  const policy = TUS_FLOW_POLICY.requestHeaders
  const supportedLayerOrder = 'operation|custom|request-id'
  if (policy.layers.join('|') !== supportedLayerOrder) {
    throw new Error(`tus: unsupported request header layer policy ${policy.layers.join('|')}`)
  }

  if (policy.requestIdSource !== 'sdk-generated-uuid') {
    throw new Error(`tus: unsupported request ID source ${policy.requestIdSource}`)
  }

  if (addRequestId && !requestId) {
    throw new Error('tus: request ID is required when addRequestId is enabled')
  }

  return {
    ...operationHeaders,
    ...customHeaders,
    ...(addRequestId && requestId ? tusRequestIdHeaders(requestId) : {}),
  }
}

export function tusResolveUploadLocation({
  location,
  requestUrl,
  resolveRelativeUrl,
}: {
  location: string
  requestUrl: string
  resolveRelativeUrl: (baseUrl: string, relativeOrAbsoluteUrl: string) => string
}): string {
  const policy = TUS_FLOW_POLICY.locationResolution
  if (policy.strategy !== 'relative-to-creation-request-url') {
    throw new Error(`tus: unsupported Location resolution strategy ${policy.strategy}`)
  }

  return resolveRelativeUrl(requestUrl, location)
}

function tusAssertRequestLifecyclePolicySupported(): void {
  const policy = TUS_FLOW_POLICY.requestLifecycle

  if (policy.hooks.beforeRequest !== 'before-transport-send') {
    throw new Error(`tus: unsupported before-request hook policy ${policy.hooks.beforeRequest}`)
  }

  if (policy.hooks.afterResponse !== 'after-successful-transport-response') {
    throw new Error(`tus: unsupported after-response hook policy ${policy.hooks.afterResponse}`)
  }

  if (policy.retry.evaluationTrigger !== 'generated-plan-evaluate-policy') {
    throw new Error(`tus: unsupported retry policy trigger ${policy.retry.evaluationTrigger}`)
  }

  if (policy.retry.customDecision !== 'custom-callback-before-default-decision') {
    throw new Error(`tus: unsupported custom retry decision ${policy.retry.customDecision}`)
  }

  if (policy.retry.defaultDecision !== 'retryable-status-and-online') {
    throw new Error(`tus: unsupported default retry decision ${policy.retry.defaultDecision}`)
  }

  if (policy.retry.onlineSignal !== 'sdk-platform-online-status') {
    throw new Error(`tus: unsupported retry online signal ${policy.retry.onlineSignal}`)
  }

  if (policy.retry.timer !== 'sdk-platform-timer') {
    throw new Error(`tus: unsupported retry timer policy ${policy.retry.timer}`)
  }
}

export function tusPlanRequestLifecycleHooks({
  hasAfterResponseHook,
  hasBeforeRequestHook,
}: {
  hasAfterResponseHook: boolean
  hasBeforeRequestHook: boolean
}): TusRequestLifecycleHookPlan {
  tusAssertRequestLifecyclePolicySupported()

  return {
    afterResponseHook: hasAfterResponseHook,
    beforeRequestHook: hasBeforeRequestHook,
  }
}

export function tusShouldEvaluateRetryPolicy({
  hasRetryableError,
  retryPlanAction,
}: {
  hasRetryableError: boolean
  retryPlanAction: TusRetryAfterErrorPlan['action']
}): boolean {
  tusAssertRequestLifecyclePolicySupported()

  return retryPlanAction === 'evaluatePolicy' && hasRetryableError
}

export function tusShouldUseCustomRetryPolicy({
  hasCustomRetryPolicy,
}: {
  hasCustomRetryPolicy: boolean
}): boolean {
  tusAssertRequestLifecyclePolicySupported()

  return hasCustomRetryPolicy
}

export function tusDefaultRetryPolicyDecision({
  isOnline,
  status,
}: {
  isOnline: boolean
  status: number
}): boolean {
  tusAssertRequestLifecyclePolicySupported()

  return tusShouldRetryStatus(status) && isOnline
}

function tusAssertAbortPolicySupported(): void {
  const policy = TUS_FLOW_POLICY.abort
  const supportedActions = [
    'mark-aborted',
    'abort-parallel-uploads',
    'abort-current-request',
    'clear-retry-timer',
    'terminate-upload-if-requested',
  ]

  for (const action of policy.sequence) {
    if (!supportedActions.includes(action)) {
      throw new Error(`tus: unsupported abort sequence action ${action}`)
    }
  }

  if (policy.terminateUpload !== 'when-requested-and-upload-url-known') {
    throw new Error(`tus: unsupported abort termination policy ${policy.terminateUpload}`)
  }

  if (policy.removeStoredUrlAfterTermination !== 'after-successful-termination') {
    throw new Error(
      `tus: unsupported abort storage cleanup policy ${policy.removeStoredUrlAfterTermination}`,
    )
  }

  if (policy.error.type !== 'DOMException') {
    throw new Error(`tus: unsupported abort error type ${policy.error.type}`)
  }
}

export function tusAbortErrorDescriptor(): TusAbortErrorDescriptor {
  tusAssertAbortPolicySupported()

  return {
    message: TUS_FLOW_POLICY.abort.error.message,
    name: TUS_FLOW_POLICY.abort.error.name,
    type: 'DOMException',
  }
}

export function tusPlanAbort({
  hasCurrentRequest,
  hasParallelUploads,
  hasRetryTimer,
  shouldTerminate,
  uploadUrl,
}: {
  hasCurrentRequest: boolean
  hasParallelUploads: boolean
  hasRetryTimer: boolean
  shouldTerminate: boolean
  uploadUrl: string | null
}): TusAbortPlan {
  tusAssertAbortPolicySupported()

  const actions: TusAbortRuntimeAction[] = []
  for (const policyAction of TUS_FLOW_POLICY.abort.sequence) {
    if (policyAction === 'mark-aborted') {
      actions.push({ action: 'markAborted' })
      continue
    }

    if (policyAction === 'abort-parallel-uploads') {
      if (hasParallelUploads) {
        actions.push({ action: 'abortParallelUploads', shouldTerminate })
      }
      continue
    }

    if (policyAction === 'abort-current-request') {
      if (hasCurrentRequest) {
        actions.push({ action: 'abortCurrentRequest' })
      }
      continue
    }

    if (policyAction === 'clear-retry-timer') {
      if (hasRetryTimer) {
        actions.push({ action: 'clearRetryTimer' })
      }
      continue
    }

    if (policyAction === 'terminate-upload-if-requested') {
      if (shouldTerminate && uploadUrl != null) {
        actions.push({ action: 'terminateUpload', removeStoredUpload: true, uploadUrl })
      }
      continue
    }

    throw new Error(`tus: unsupported abort sequence action ${policyAction}`)
  }

  return { actions }
}

function tusAssertUploadUrlAvailableHookPolicySupported(): void {
  const policy = TUS_FLOW_POLICY.eventHooks.uploadUrlAvailable

  if (policy.createUpload !== 'after-url-known-before-storage') {
    throw new Error(`tus: unsupported create upload URL hook policy ${policy.createUpload}`)
  }

  if (policy.resumeUpload !== 'after-url-known-before-storage') {
    throw new Error(`tus: unsupported resume upload URL hook policy ${policy.resumeUpload}`)
  }

  if (policy.parallelFinalUpload !== 'not-emitted') {
    throw new Error(
      `tus: unsupported parallel final upload URL hook policy ${policy.parallelFinalUpload}`,
    )
  }
}

export function tusPlanUploadUrlAvailableHook({
  context,
  hasHook,
}: {
  context: TusUploadUrlAvailableHookContext
  hasHook: boolean
}): TusUploadUrlAvailableHookPlan {
  tusAssertUploadUrlAvailableHookPolicySupported()

  return {
    shouldCall: hasHook && TUS_FLOW_POLICY.eventHooks.uploadUrlAvailable[context] !== 'not-emitted',
  }
}

export function tusCommonSupportedFileSourceTypes(): readonly string[] {
  return [...TUS_FLOW_POLICY.fileSources.commonTypes]
}

export function tusNodeSupportedFileSourceTypes(): readonly string[] {
  return [...TUS_FLOW_POLICY.fileSources.commonTypes, ...TUS_FLOW_POLICY.fileSources.nodeExtraTypes]
}

export function tusUnsupportedSourceTypeMessage({
  supportedTypes,
}: {
  supportedTypes: readonly string[]
}): string {
  return tusFormatFlowMessage(TUS_FLOW_POLICY.fileSources.messages.unsupportedSourceType, {
    supportedTypes: supportedTypes.join(', '),
  })
}

export function tusValidateWebStreamChunkSize({
  chunkSize,
}: {
  chunkSize: unknown
}): TusFileSourceChunkSizeValidationResult {
  const normalizedChunkSize = Number(chunkSize)
  if (!Number.isFinite(normalizedChunkSize)) {
    return {
      message: TUS_FLOW_POLICY.fileSources.messages.webStreamChunkSizeRequired,
      ok: false,
      reason: 'missingFiniteChunkSize',
    }
  }

  return { chunkSize: normalizedChunkSize, ok: true }
}

export function tusValidateNodeStreamChunkSize({
  chunkSize,
}: {
  chunkSize: unknown
}): TusFileSourceChunkSizeValidationResult {
  const normalizedChunkSize = Number(chunkSize)
  if (!Number.isFinite(normalizedChunkSize)) {
    return {
      message: TUS_FLOW_POLICY.fileSources.messages.nodeStreamChunkSizeRequired,
      ok: false,
      reason: 'missingFiniteChunkSize',
    }
  }

  return { chunkSize: normalizedChunkSize, ok: true }
}

export function tusWebStreamUnknownDataTypeMessage(): string {
  return TUS_FLOW_POLICY.fileSources.messages.webStreamUnknownDataType
}

export function tusWebStreamAlreadyLockedMessage(): string {
  return TUS_FLOW_POLICY.fileSources.messages.webStreamAlreadyLocked
}

export function tusWebStreamBackwardsReadMessage(): string {
  return TUS_FLOW_POLICY.fileSources.messages.webStreamBackwardsRead
}

export function tusWebStreamMissingBufferMessage(): string {
  return TUS_FLOW_POLICY.fileSources.messages.webStreamMissingBuffer
}

export function tusNodeStreamBackwardsReadMessage(): string {
  return TUS_FLOW_POLICY.fileSources.messages.nodeStreamBackwardsRead
}

export function tusNodeStreamStartOutsideBufferMessage(): string {
  return TUS_FLOW_POLICY.fileSources.messages.nodeStreamStartOutsideBuffer
}

function tusAssertHttpStackPolicySupported(): void {
  const policy = TUS_FLOW_POLICY.httpStacks

  if (policy.browserStackNodeReadableBody !== 'unsupported') {
    throw new Error(
      `tus: unsupported browser HTTP stack Node readable body policy ${policy.browserStackNodeReadableBody}`,
    )
  }

  if (policy.nodeStackUnsupportedBodyType !== 'throw') {
    throw new Error(
      `tus: unsupported Node HTTP stack body type policy ${policy.nodeStackUnsupportedBodyType}`,
    )
  }

  if (policy.nodeStackMissingStatusCode !== 'throw') {
    throw new Error(
      `tus: unsupported Node HTTP stack status code policy ${policy.nodeStackMissingStatusCode}`,
    )
  }
}

export function tusHttpStackNodeReadableBodyUnsupportedMessage({
  stackName,
}: {
  stackName: string
}): string {
  tusAssertHttpStackPolicySupported()

  return tusFormatFlowMessage(
    TUS_FLOW_POLICY.httpStacks.messages.browserStackNodeReadableBodyUnsupported,
    { stackName },
  )
}

export function tusNodeHttpStackUnsupportedBodyTypeMessage({
  bodyType,
  constructorName,
}: {
  bodyType: string
  constructorName: string
}): string {
  tusAssertHttpStackPolicySupported()

  return tusFormatFlowMessage(TUS_FLOW_POLICY.httpStacks.messages.nodeStackUnsupportedBodyType, {
    bodyType,
    constructorName,
  })
}

export function tusNodeHttpStackMissingStatusCodeMessage(): string {
  tusAssertHttpStackPolicySupported()

  return TUS_FLOW_POLICY.httpStacks.messages.nodeStackMissingStatusCode
}

export function tusPlanSingleUploadStart({
  currentUrl,
  uploadUrl,
}: {
  currentUrl: string | null
  uploadUrl: string | null | undefined
}): TusSingleUploadStartPlan {
  if (currentUrl != null) {
    return {
      action: 'resumeCurrent',
      logMessage: `Resuming upload from previous URL: ${currentUrl}`,
      url: currentUrl,
    }
  }

  if (uploadUrl != null) {
    return {
      action: 'resumeConfigured',
      logMessage: `Resuming upload from provided URL: ${uploadUrl}`,
      url: uploadUrl,
    }
  }

  return { action: 'create', logMessage: 'Creating a new upload' }
}

export function tusPlanResumeUploadRequest({
  uploadUrl,
}: {
  uploadUrl: string | null | undefined
}): TusResumeUploadRequestPlan {
  if (uploadUrl == null) {
    return {
      ok: false,
      message: TUS_FLOW_POLICY.messages.missingPatchUrl,
      reason: 'missingUploadUrl',
    }
  }

  return {
    ok: true,
    requestErrorMessage: TUS_FLOW_POLICY.messages.resumeUploadRequestFailed,
    uploadUrl,
  }
}

export function tusPlanFingerprint({
  fingerprint,
}: {
  fingerprint: string | null | undefined
}): TusFingerprintPlan {
  if (!fingerprint) {
    return {
      ok: false,
      message: TUS_FLOW_POLICY.messages.fingerprintUnavailable,
      reason: 'missingFingerprint',
    }
  }

  return { fingerprint, ok: true }
}

export function tusPlanParallelUploadSlice({
  hasValue,
}: {
  hasValue: boolean
}): TusParallelUploadSlicePlan {
  if (!hasValue) {
    return {
      ok: false,
      message: TUS_FLOW_POLICY.messages.parallelUploadSliceMissingValue,
      reason: 'missingValue',
    }
  }

  return { ok: true }
}

export function tusPlanUploadChunkRequest({
  offset,
  uploadUrl,
}: {
  offset: number
  uploadUrl: string | null | undefined
}): TusUploadChunkRequestPlan {
  if (uploadUrl == null) {
    return {
      ok: false,
      message: TUS_FLOW_POLICY.messages.missingPatchUrl,
      reason: 'missingUploadUrl',
    }
  }

  return {
    ok: true,
    requestErrorMessage: tusFormatFlowMessage(TUS_FLOW_POLICY.messages.uploadChunkRequestFailed, {
      offset,
    }),
    uploadUrl,
  }
}

export function tusPlanTerminateUploadRequest({
  uploadUrl,
}: {
  uploadUrl: string
}): TusTerminateUploadRequestPlan {
  return {
    requestErrorMessage: TUS_FLOW_POLICY.messages.terminateUploadRequestFailed,
    uploadUrl,
  }
}

export function tusUrlStorageAllUploadsPrefix(): string {
  return `${TUS_FLOW_POLICY.urlStorage.namespace}${TUS_FLOW_POLICY.urlStorage.separator}`
}

export function tusUrlStorageFingerprintPrefix({ fingerprint }: { fingerprint: string }): string {
  return `${tusUrlStorageAllUploadsPrefix()}${fingerprint}${TUS_FLOW_POLICY.urlStorage.separator}`
}

export function tusUrlStorageKey({
  fingerprint,
  id,
}: {
  fingerprint: string
  id: number | string
}): string {
  return `${tusUrlStorageFingerprintPrefix({ fingerprint })}${id}`
}

export function tusUrlStorageId({ randomValue }: { randomValue: number }): number {
  const policy = TUS_FLOW_POLICY.urlStorage.id
  if (policy.strategy !== 'rounded-random-number') {
    throw new Error(`tus: unsupported URL storage ID policy ${policy.strategy}`)
  }

  return Math.round(randomValue * policy.multiplier)
}

export function tusWebStorageProbeKey(): string {
  return TUS_FLOW_POLICY.urlStorage.webStorage.probeKey
}

export function tusIsWebStorageUnavailableError({
  domExceptionName,
}: {
  domExceptionName: string
}): boolean {
  return TUS_FLOW_POLICY.urlStorage.webStorage.unavailableDomExceptionNames.includes(
    domExceptionName,
  )
}

export function tusShouldIgnoreMalformedStoredUpload(): boolean {
  const policy = TUS_FLOW_POLICY.urlStorage.webStorage.malformedEntry
  if (policy === 'ignore') {
    return true
  }

  throw new Error(`tus: unsupported malformed stored upload policy ${policy}`)
}

export function tusUrlStorageMissingKeyMessage({ index }: { index: number }): string {
  return tusFormatFlowMessage(TUS_FLOW_POLICY.urlStorage.messages.missingKey, {
    index,
  })
}

export function tusUrlStorageMissingItemMessage({ key }: { key: string }): string {
  return tusFormatFlowMessage(TUS_FLOW_POLICY.urlStorage.messages.missingItem, {
    key,
  })
}

function tusAssertUrlStorageRecordPolicySupported(): void {
  const policy = TUS_FLOW_POLICY.urlStorage.record

  if (policy.creationTime !== 'sdk-current-date-string') {
    throw new Error(`tus: unsupported URL storage creation time policy ${policy.creationTime}`)
  }

  if (policy.missingUrl !== 'fail') {
    throw new Error(`tus: unsupported URL storage missing URL policy ${policy.missingUrl}`)
  }

  if (policy.storedUrlKind !== 'single-or-parallel-upload-url') {
    throw new Error(`tus: unsupported URL storage URL kind policy ${policy.storedUrlKind}`)
  }
}

function tusAssertUrlStorageCleanupPolicySupported(): void {
  if (TUS_FLOW_POLICY.urlStorage.removeOnSuccess !== 'when-option-enabled') {
    throw new Error(
      `tus: unsupported URL storage success cleanup policy ${TUS_FLOW_POLICY.urlStorage.removeOnSuccess}`,
    )
  }
}

export function tusShouldRemoveStoredUploadOnSuccess({
  removeFingerprintOnSuccess,
}: {
  removeFingerprintOnSuccess: boolean
}): boolean {
  tusAssertUrlStorageCleanupPolicySupported()

  return removeFingerprintOnSuccess
}

export function tusPlanStoredUploadRecord({
  creationTime,
  fingerprint,
  metadata,
  parallelUploadUrls,
  size,
  uploadUrl,
  useParallelUploadUrls,
}: {
  creationTime: string
  fingerprint: string
  metadata: Record<string, string>
  parallelUploadUrls?: string[]
  size: number | null
  uploadUrl: string | null
  useParallelUploadUrls: boolean
}): TusStoredUploadRecordPlan {
  tusAssertUrlStorageRecordPolicySupported()

  if (useParallelUploadUrls) {
    if (parallelUploadUrls == null) {
      return {
        ok: false,
        message: TUS_FLOW_POLICY.messages.storageMissingParallelUploadUrls,
        reason: 'missingParallelUploadUrls',
      }
    }

    return {
      ok: true,
      upload: {
        creationTime,
        metadata,
        parallelUploadUrls,
        size,
        urlStorageKey: fingerprint,
      },
    }
  }

  if (uploadUrl == null) {
    return {
      ok: false,
      message: TUS_FLOW_POLICY.messages.storageMissingUploadUrl,
      reason: 'missingUploadUrl',
    }
  }

  return {
    ok: true,
    upload: {
      creationTime,
      metadata,
      size,
      uploadUrl,
      urlStorageKey: fingerprint,
    },
  }
}

export function tusValidateCreateUpload({
  hasEndpoint,
  size,
  uploadLengthDeferred,
}: {
  hasEndpoint: boolean
  size: number | null
  uploadLengthDeferred: boolean
}): TusCreateUploadValidationResult {
  if (!hasEndpoint) {
    return {
      ok: false,
      message: TUS_FLOW_POLICY.messages.createMissingEndpoint,
      reason: 'missingEndpoint',
    }
  }

  if (!uploadLengthDeferred && size == null) {
    return { ok: false, message: TUS_FLOW_POLICY.messages.createMissingSize, reason: 'missingSize' }
  }

  return { ok: true }
}

export function tusShouldSendUploadBodyDuringCreation({
  uploadDataDuringCreation,
  uploadLengthDeferred,
}: {
  uploadDataDuringCreation: boolean
  uploadLengthDeferred: boolean
}): boolean {
  return uploadDataDuringCreation && !uploadLengthDeferred
}

export function tusCreateUploadCompleteValue({
  uploadDataDuringCreation,
}: {
  uploadDataDuringCreation: boolean
}): boolean | undefined {
  return uploadDataDuringCreation ? undefined : false
}

export function tusPlanUploadCreationRequest({
  endpoint,
  size,
  uploadDataDuringCreation,
  uploadLengthDeferred,
}: {
  endpoint: string | null | undefined
  size: number | null
  uploadDataDuringCreation: boolean
  uploadLengthDeferred: boolean
}): TusUploadCreationRequestPlan {
  const validation = tusValidateCreateUpload({
    hasEndpoint: endpoint != null,
    size,
    uploadLengthDeferred,
  })
  if (!validation.ok) {
    return validation
  }

  if (endpoint == null) {
    return {
      ok: false,
      message: TUS_FLOW_POLICY.messages.createMissingEndpoint,
      reason: 'missingEndpoint',
    }
  }

  return {
    endpoint,
    ok: true,
    requestErrorMessage: TUS_FLOW_POLICY.messages.createUploadRequestFailed,
    uploadComplete: tusCreateUploadCompleteValue({ uploadDataDuringCreation }),
  }
}

export function tusPlanPreparedUploadSize({
  sourceSize,
  uploadLengthDeferred,
  uploadSize,
}: {
  sourceSize: number | null | undefined
  uploadLengthDeferred: boolean
  uploadSize: unknown
}): TusPreparedUploadSizePlan {
  if (uploadLengthDeferred) {
    return { ok: true, size: null }
  }

  if (uploadSize != null) {
    const size = Number(uploadSize)
    if (Number.isNaN(size)) {
      return {
        ok: false,
        message: TUS_FLOW_POLICY.messages.invalidUploadSize,
        reason: 'invalidUploadSize',
      }
    }

    return { ok: true, size }
  }

  if (sourceSize == null) {
    return {
      ok: false,
      message: TUS_FLOW_POLICY.messages.cannotDeriveUploadSize,
      reason: 'cannotDeriveUploadSize',
    }
  }

  return { ok: true, size: sourceSize }
}

export function tusPlanPreparedUploadMode({
  hasParallelUploadUrls,
  parallelUploads,
}: {
  hasParallelUploadUrls: boolean
  parallelUploads: number
}): TusPreparedUploadModePlan {
  if (hasParallelUploadUrls || parallelUploads >= TUS_FLOW_POLICY.minimumParallelUploads) {
    return { action: 'parallel' }
  }

  return { action: 'single' }
}

function tusSplitSizeIntoParallelUploadBoundaries({
  partCount,
  totalSize,
}: {
  partCount: number
  totalSize: number
}): TusParallelUploadBoundary[] {
  if (TUS_FLOW_POLICY.parallelUploadSplit.strategy !== 'contiguous-floor-size-last-remainder') {
    throw new Error(
      `tus: unsupported parallel upload split strategy ${TUS_FLOW_POLICY.parallelUploadSplit.strategy}`,
    )
  }

  const partSize = Math.floor(totalSize / partCount)
  const parts: TusParallelUploadBoundary[] = []

  for (let index = 0; index < partCount; index += 1) {
    parts.push({
      end: partSize * (index + 1),
      start: partSize * index,
    })
  }

  parts[partCount - 1].end = totalSize

  return parts
}

export function tusPlanParallelUploadParts({
  parallelUploadBoundaries,
  parallelUploads,
  parallelUploadUrls,
  size,
}: {
  parallelUploadBoundaries: readonly TusParallelUploadBoundary[] | null | undefined
  parallelUploads: number
  parallelUploadUrls: readonly string[] | null | undefined
  size: number | null
}): TusParallelUploadPartsPlan {
  if (size == null) {
    return {
      ok: false,
      message: TUS_FLOW_POLICY.messages.parallelUploadMissingSize,
      reason: 'missingSize',
    }
  }

  const partCount = parallelUploadUrls != null ? parallelUploadUrls.length : parallelUploads
  const boundaries =
    parallelUploadBoundaries ??
    tusSplitSizeIntoParallelUploadBoundaries({ partCount, totalSize: size })

  return {
    ok: true,
    parts: boundaries.map((part, index) => ({
      ...part,
      uploadUrl: parallelUploadUrls?.[index] || null,
    })),
    totalSize: size,
  }
}

function tusAssertParallelPartialUploadPolicySupported(): void {
  const policy = TUS_FLOW_POLICY.parallelPartialUpload

  if (policy.headerKind !== 'partial-upload') {
    throw new Error(`tus: unsupported partial upload header kind ${policy.headerKind}`)
  }

  if (policy.metadataSource !== 'metadataForPartialUploads') {
    throw new Error(`tus: unsupported partial upload metadata source ${policy.metadataSource}`)
  }

  if (policy.nestedParallelUploads !== 'disabled') {
    throw new Error(
      `tus: unsupported nested parallel upload policy ${policy.nestedParallelUploads}`,
    )
  }

  if (policy.urlStorage !== 'parent-managed') {
    throw new Error(`tus: unsupported partial upload URL storage policy ${policy.urlStorage}`)
  }
}

export function tusPlanParallelPartialUploadOptions({
  headers,
  metadataForPartialUploads,
  uploadUrl,
}: {
  headers: Record<string, string>
  metadataForPartialUploads: Record<string, string>
  uploadUrl: string | null
}): TusParallelPartialUploadOptionsPlan {
  tusAssertParallelPartialUploadPolicySupported()

  return {
    headers: {
      ...headers,
      ...tusPartialUploadHeaders(),
    },
    metadata: metadataForPartialUploads,
    parallelUploadBoundaries: null,
    parallelUploads: 1,
    removeFingerprintOnSuccess: false,
    storeFingerprintForResuming: false,
    uploadUrl: uploadUrl || null,
  }
}

export function tusPlanFinalUploadCreation({
  endpoint,
  partialUploadUrls,
}: {
  endpoint: string | null | undefined
  partialUploadUrls: readonly string[] | null | undefined
}): TusFinalUploadCreationPlan {
  if (endpoint == null) {
    return {
      ok: false,
      message: TUS_FLOW_POLICY.messages.createMissingEndpoint,
      reason: 'missingEndpoint',
    }
  }

  if (partialUploadUrls == null) {
    return {
      ok: false,
      message: TUS_FLOW_POLICY.messages.finalUploadMissingPartialUrls,
      reason: 'missingPartialUploadUrls',
    }
  }

  return {
    endpoint,
    ok: true,
    requestErrorMessage: TUS_FLOW_POLICY.messages.finalUploadRequestFailed,
    uploadUrls: partialUploadUrls,
  }
}

export function tusCreatedUploadCompletesWithoutPatch({ size }: { size: number | null }): boolean {
  return size === 0
}

export function tusPlanUploadCreationResponse({
  followUp,
  response,
  size,
}: {
  followUp: TusUploadCreationFollowUp
  response: TusUploadCreationResponseReadResult
  size: number | null
}): TusUploadCreationResponsePlan {
  if (!response.ok && response.reason === 'unexpectedStatus') {
    return {
      action: 'fail',
      message: TUS_FLOW_POLICY.messages.unexpectedCreateResponse,
      reason: response.reason,
    }
  }

  if (!response.ok) {
    return {
      action: 'fail',
      message: TUS_FLOW_POLICY.messages.uploadLocationMissing,
      reason: response.reason,
    }
  }

  if (followUp === 'none' || tusCreatedUploadCompletesWithoutPatch({ size })) {
    return { action: 'complete', location: response.location }
  }

  return { action: 'continue', location: response.location }
}

export function tusPlanResumeResponseStatus({
  hasEndpoint,
  status,
}: {
  hasEndpoint: boolean
  status: number
}): TusResumeResponseStatusPlan {
  if (tusIsSuccessfulResponseStatus(status)) {
    return { action: 'readOffset' }
  }

  if (tusIsLockedStatus(status)) {
    return {
      action: 'fail',
      message: TUS_FLOW_POLICY.messages.lockedUpload,
      reason: 'locked',
      removeStoredUpload: false,
    }
  }

  const removeStoredUpload = tusIsClientErrorStatus(status)
  if (!hasEndpoint) {
    return {
      action: 'fail',
      message: TUS_FLOW_POLICY.messages.resumeWithoutEndpoint,
      reason: 'resumeWithoutEndpoint',
      removeStoredUpload,
    }
  }

  return { action: 'create', removeStoredUpload }
}

export function tusPlanResumeOffsetResponse({
  response,
}: {
  response: TusUploadOffsetResponseReadResult
}): TusResumeOffsetResponsePlan {
  if (!response.ok && response.reason === 'unexpectedStatus') {
    return {
      action: 'fail',
      message: TUS_FLOW_POLICY.messages.unexpectedResumeResponse,
      reason: response.reason,
    }
  }

  if (!response.ok && response.reason === 'missingOffset') {
    return {
      action: 'fail',
      message: TUS_FLOW_POLICY.messages.missingResumeOffset,
      reason: response.reason,
    }
  }

  if (!response.ok && response.reason === 'invalidOffset') {
    return {
      action: 'fail',
      message: TUS_FLOW_POLICY.messages.invalidResumeOffset,
      reason: response.reason,
    }
  }

  if (!response.ok) {
    return {
      action: 'fail',
      message: TUS_FLOW_POLICY.messages.invalidResumeLength,
      reason: response.reason,
    }
  }

  return {
    action: 'continue',
    length: response.length,
    offset: response.offset,
    uploadLengthDeferred: response.uploadLengthDeferred,
  }
}

export function tusUploadIsCompleteAfterOffset({
  length,
  offset,
}: {
  length: number | null
  offset: number
}): boolean {
  return length != null && offset === length
}

export function tusPlanUploadCompletionAfterOffset({
  length,
  offset,
}: {
  length: number | null
  offset: number
}): TusUploadOffsetCompletionPlan {
  if (length == null || offset !== length) {
    return { complete: false }
  }

  return { complete: true, length }
}

export function tusUploadIsCompleteAfterChunk({
  offset,
  size,
}: {
  offset: number
  size: number | null
}): boolean {
  return offset === size
}

export function tusPlanUploadChunkResponse({
  currentOffset,
  response,
  size,
}: {
  currentOffset: number
  response: TusUploadChunkResponseReadResult
  size: number | null
}): TusUploadChunkResponsePlan {
  if (!response.ok && response.reason === 'unexpectedStatus') {
    return {
      action: 'fail',
      message: TUS_FLOW_POLICY.messages.unexpectedChunkResponse,
      reason: response.reason,
    }
  }

  if (!response.ok) {
    return {
      action: 'fail',
      message: TUS_FLOW_POLICY.messages.invalidChunkOffset,
      reason: response.reason,
    }
  }

  const chunkSize = response.offset - currentOffset
  if (tusUploadIsCompleteAfterChunk({ offset: response.offset, size })) {
    return { action: 'complete', chunkSize, offset: response.offset }
  }

  return { action: 'continue', chunkSize, offset: response.offset }
}

export function tusShouldResetRetryAttempt({
  offset,
  offsetBeforeRetry,
}: {
  offset: number
  offsetBeforeRetry: number
}): boolean {
  return offset > offsetBeforeRetry
}

export function tusPlanRetryAfterError({
  isNetworkError,
  offset,
  offsetBeforeRetry,
  retryAttempt,
  retryDelays,
  shouldRetry,
}: {
  isNetworkError: boolean
  offset: number
  offsetBeforeRetry: number
  retryAttempt: number
  retryDelays: readonly number[] | null
  shouldRetry?: boolean
}): TusRetryAfterErrorPlan {
  const effectiveRetryAttempt = tusShouldResetRetryAttempt({ offset, offsetBeforeRetry })
    ? 0
    : retryAttempt

  if (retryDelays == null || effectiveRetryAttempt >= retryDelays.length || !isNetworkError) {
    return { action: 'emitError', retryAttempt: effectiveRetryAttempt }
  }

  if (shouldRetry == null) {
    return { action: 'evaluatePolicy', retryAttempt: effectiveRetryAttempt }
  }

  if (!shouldRetry) {
    return { action: 'emitError', retryAttempt: effectiveRetryAttempt }
  }

  return {
    action: 'retry',
    delay: retryDelays[effectiveRetryAttempt],
    nextRetryAttempt: effectiveRetryAttempt + 1,
    offsetBeforeRetry: offset,
    retryAttempt: effectiveRetryAttempt,
  }
}

export function tusShouldStoreUpload({
  fingerprint,
  hasUrlStorageKey,
  storeFingerprintForResuming,
}: {
  fingerprint: string | null
  hasUrlStorageKey: boolean
  storeFingerprintForResuming: boolean
}): boolean {
  return storeFingerprintForResuming && fingerprint != null && !hasUrlStorageKey
}

export function tusPlanUploadStorage({
  fingerprint,
  hasUrlStorageKey,
  storeFingerprintForResuming,
}: {
  fingerprint: string | null
  hasUrlStorageKey: boolean
  storeFingerprintForResuming: boolean
}): TusUploadStoragePlan {
  if (!storeFingerprintForResuming || fingerprint == null || hasUrlStorageKey) {
    return { shouldStore: false }
  }

  return { fingerprint, shouldStore: true }
}

export function tusChunkEnd({
  chunkSize,
  offset,
  size,
  uploadLengthDeferred,
}: {
  chunkSize: number
  offset: number
  size: number | null
  uploadLengthDeferred: boolean
}): number {
  const end = offset + chunkSize
  if ((end === Number.POSITIVE_INFINITY || (size != null && end > size)) && !uploadLengthDeferred) {
    return size ?? end
  }

  return end
}

export function tusDeferredUploadLengthPlan({
  done,
  offset,
  uploadLengthDeferred,
  valueSize,
}: {
  done: boolean
  offset: number
  uploadLengthDeferred: boolean
  valueSize: number
}): TusDeferredUploadLengthPlan {
  if (!uploadLengthDeferred || !done) {
    return { shouldDeclareLength: false }
  }

  return { shouldDeclareLength: true, size: offset + valueSize }
}

export function tusCheckConfiguredUploadSize({
  done,
  newSize,
  size,
  uploadLengthDeferred,
}: {
  done: boolean
  newSize: number
  size: number | null
  uploadLengthDeferred: boolean
}): TusConfiguredUploadSizeCheck {
  if (uploadLengthDeferred || !done || newSize === size) {
    return { ok: true }
  }

  return {
    message: tusFormatFlowMessage(TUS_FLOW_POLICY.messages.configuredUploadSizeMismatch, {
      actualSize: newSize,
      expectedSize: size ?? 'unknown',
    }),
    ok: false,
  }
}

export function tusStatusInCategory(status: number, category: number): boolean {
  return status >= category && status < category + 100
}

export function tusIsSuccessfulResponseStatus(status: number): boolean {
  return tusStatusInCategory(status, TUS_RETRY_POLICY.successStatusCategory)
}

export function tusIsClientErrorStatus(status: number): boolean {
  return tusStatusInCategory(status, TUS_RETRY_POLICY.clientErrorStatusCategory)
}

export function tusIsLockedStatus(status: number): boolean {
  return status === TUS_RETRY_POLICY.lockedStatusCode
}

export function tusShouldRetryStatus(status: number): boolean {
  return (
    !tusIsClientErrorStatus(status) || TUS_RETRY_POLICY.retryableClientStatusCodes.includes(status)
  )
}

export function tusPlanTerminateResponse({ status }: { status: number }): TusTerminateResponsePlan {
  if (tusExpectedResponseStatusForOperation(TUS_OPERATION_IDS.TERMINATE_TUS_UPLOAD, status)) {
    return { action: 'complete' }
  }

  return {
    action: 'fail',
    message: TUS_FLOW_POLICY.messages.unexpectedTerminateResponse,
    reason: 'unexpectedStatus',
  }
}

export function tusExpectedResponseStatusForOperation(
  operationId: string,
  status: number,
): boolean {
  return TUS_OPERATION_RESPONSE_STATUS_CODES[operationId]?.includes(status) ?? false
}

export function tusRequiresKnownUploadLengthOnOffsetResponse(protocol: string): boolean {
  return TUS_PROTOCOLS_REQUIRING_KNOWN_UPLOAD_LENGTH_ON_OFFSET_RESPONSE.includes(protocol)
}

export function tusRequestHeadersForProtocol(protocol: string): Record<string, string> {
  return { ...(TUS_PROTOCOL_REQUEST_HEADERS[protocol] ?? {}) }
}

export function tusRequestPlanForOperation({
  headers = {},
  operationId,
  protocol,
  url,
}: {
  headers?: Record<string, string>
  operationId: string
  protocol: string
  url: string
}): TusRequestPlan {
  const method = TUS_OPERATION_METHOD_BY_ID[operationId]
  if (method == null) {
    throw new Error(`Unknown TUS operation: ${operationId}`)
  }

  return {
    headers: {
      ...tusRequestHeadersForProtocol(protocol),
      ...headers,
    },
    method,
    operationId,
    url,
  }
}

export function tusSupportsProtocol(protocol: string): boolean {
  return TUS_SUPPORTED_PROTOCOLS.includes(protocol)
}

export function tusUploadBodyContentTypeForProtocol(protocol: string): string | undefined {
  return TUS_PROTOCOL_UPLOAD_BODY_CONTENT_TYPES[protocol]
}

export function tusUploadCompleteHeaderForProtocol(
  protocol: string,
  done: boolean,
): { name: string; value: string } | undefined {
  const header = TUS_PROTOCOL_UPLOAD_COMPLETE_HEADERS[protocol]
  if (!header) {
    return undefined
  }

  return {
    name: header.name,
    value: done ? header.completeValue : header.incompleteValue,
  }
}

export function tusPartialUploadHeaders(): Record<string, string> {
  return {
    [TUS_CONCATENATION.headerName]: TUS_CONCATENATION.partialValue,
  }
}

export function tusFinalUploadConcatValue(uploadUrls: readonly string[]): string {
  return `${TUS_CONCATENATION.finalPrefix}${uploadUrls.join(TUS_CONCATENATION.uploadUrlSeparator)}`
}

export function tusEncodeMetadata(
  metadata: Record<string, string>,
  encodeMetadataValue: (value: string) => string,
): string {
  return Object.entries(metadata)
    .map(
      ([key, value]) =>
        `${key}${TUS_METADATA_ENCODING.keyValueSeparator}${encodeMetadataValue(String(value))}`,
    )
    .join(TUS_METADATA_ENCODING.entrySeparator)
}

export function tusMetadataHeaders(
  metadata: Record<string, string>,
  encodeMetadataValue: (value: string) => string,
): Record<string, string> {
  const encodedMetadata = tusEncodeMetadata(metadata, encodeMetadataValue)
  if (encodedMetadata === '') {
    return {}
  }

  return {
    [TUS_HEADERS.UPLOAD_METADATA]: encodedMetadata,
  }
}

export function tusCreateUploadHeaders({
  encodeMetadataValue,
  metadata,
  size,
  uploadLengthDeferred,
}: {
  encodeMetadataValue: (value: string) => string
  metadata: Record<string, string>
  size: number | null
  uploadLengthDeferred: boolean
}): Record<string, string> {
  return {
    ...(uploadLengthDeferred
      ? { [TUS_HEADERS.UPLOAD_DEFER_LENGTH]: '1' }
      : size == null
        ? {}
        : { [TUS_HEADERS.UPLOAD_LENGTH]: `${size}` }),
    ...tusMetadataHeaders(metadata, encodeMetadataValue),
  }
}

export function tusPatchUploadHeaders({
  offset,
  size,
}: {
  offset: number
  size?: number
}): Record<string, string> {
  return {
    [TUS_HEADERS.UPLOAD_OFFSET]: `${offset}`,
    ...(size == null ? {} : { [TUS_HEADERS.UPLOAD_LENGTH]: `${size}` }),
  }
}

export function tusUploadLengthHeaders({ size }: { size: number }): Record<string, string> {
  return {
    [TUS_HEADERS.UPLOAD_LENGTH]: `${size}`,
  }
}

export function tusFinalUploadHeaders({
  encodeMetadataValue,
  metadata,
  uploadUrls,
}: {
  encodeMetadataValue: (value: string) => string
  metadata: Record<string, string>
  uploadUrls: readonly string[]
}): Record<string, string> {
  return {
    [TUS_HEADERS.UPLOAD_CONCAT]: tusFinalUploadConcatValue(uploadUrls),
    ...tusMetadataHeaders(metadata, encodeMetadataValue),
  }
}

export function tusUploadCompleteHeaders({
  done,
  protocol,
}: {
  done: boolean
  protocol: string
}): Record<string, string> {
  const uploadCompleteHeader = tusUploadCompleteHeaderForProtocol(protocol, done)

  return {
    ...(uploadCompleteHeader ? { [uploadCompleteHeader.name]: uploadCompleteHeader.value } : {}),
  }
}

export function tusUploadBodyHeaders({
  done,
  protocol,
}: {
  done: boolean
  protocol: string
}): Record<string, string> {
  const contentType = tusUploadBodyContentTypeForProtocol(protocol)

  return {
    ...(contentType ? { [TUS_UPLOAD_BODY.contentTypeHeaderName]: contentType } : {}),
    ...tusUploadCompleteHeaders({ done, protocol }),
  }
}

export function tusCreateUploadRequestPlan({
  encodeMetadataValue,
  endpoint,
  metadata,
  protocol,
  size,
  uploadComplete,
  uploadLengthDeferred,
}: {
  encodeMetadataValue: (value: string) => string
  endpoint: string
  metadata: Record<string, string>
  protocol: string
  size: number | null
  uploadComplete?: boolean
  uploadLengthDeferred: boolean
}): TusRequestPlan {
  return tusRequestPlanForOperation({
    headers: {
      ...tusCreateUploadHeaders({
        encodeMetadataValue,
        metadata,
        size,
        uploadLengthDeferred,
      }),
      ...(uploadComplete == null
        ? {}
        : tusUploadCompleteHeaders({ done: uploadComplete, protocol })),
    },
    operationId: TUS_OPERATION_IDS.CREATE_TUS_UPLOAD,
    protocol,
    url: endpoint,
  })
}

export function tusFinalUploadRequestPlan({
  encodeMetadataValue,
  endpoint,
  metadata,
  protocol,
  uploadUrls,
}: {
  encodeMetadataValue: (value: string) => string
  endpoint: string
  metadata: Record<string, string>
  protocol: string
  uploadUrls: readonly string[]
}): TusRequestPlan {
  return tusRequestPlanForOperation({
    headers: tusFinalUploadHeaders({
      encodeMetadataValue,
      metadata,
      uploadUrls,
    }),
    operationId: TUS_OPERATION_IDS.CREATE_TUS_UPLOAD,
    protocol,
    url: endpoint,
  })
}

export function tusGetUploadOffsetRequestPlan({
  protocol,
  uploadUrl,
}: {
  protocol: string
  uploadUrl: string
}): TusRequestPlan {
  return tusRequestPlanForOperation({
    operationId: TUS_OPERATION_IDS.GET_TUS_UPLOAD_OFFSET,
    protocol,
    url: uploadUrl,
  })
}

export function tusPatchUploadRequestPlan({
  offset,
  overridePatchMethod,
  protocol,
  uploadUrl,
}: {
  offset: number
  overridePatchMethod: boolean
  protocol: string
  uploadUrl: string
}): TusRequestPlan {
  const methodOverride = overridePatchMethod
    ? tusMethodOverrideForOperation(TUS_OPERATION_IDS.PATCH_TUS_UPLOAD)
    : undefined
  const plan = tusRequestPlanForOperation({
    headers: {
      ...(methodOverride?.headers ?? {}),
      ...tusPatchUploadHeaders({ offset }),
    },
    operationId: TUS_OPERATION_IDS.PATCH_TUS_UPLOAD,
    protocol,
    url: uploadUrl,
  })

  return {
    ...plan,
    method: methodOverride?.method ?? plan.method,
  }
}

export function tusTerminateUploadRequestPlan({
  protocol,
  uploadUrl,
}: {
  protocol: string
  uploadUrl: string
}): TusRequestPlan {
  return tusRequestPlanForOperation({
    operationId: TUS_OPERATION_IDS.TERMINATE_TUS_UPLOAD,
    protocol,
    url: uploadUrl,
  })
}

export function tusMethodOverrideForOperation(
  operationId: string,
): { headers: Record<string, string>; method: string } | undefined {
  const override = TUS_METHOD_OVERRIDES[operationId]
  if (!override) {
    return undefined
  }

  return {
    headers: { ...override.headers },
    method: override.method,
  }
}

export function tusRequestIdHeaders(requestId: string): Record<string, string> {
  return {
    [TUS_REQUEST_ID_HEADER_NAME]: requestId,
  }
}

function tusReadNumericHeader(
  getHeader: (headerName: string) => string | undefined,
  headerName: string,
): TusNumericHeaderReadResult {
  const value = getHeader(headerName)
  if (value === undefined) {
    return { ok: false, reason: 'missing' }
  }

  const parsed = Number.parseInt(value, 10)
  if (Number.isNaN(parsed)) {
    return { ok: false, reason: 'invalid' }
  }

  return { ok: true, value: parsed }
}

export function tusReadUploadLocation(
  getHeader: (headerName: string) => string | undefined,
): string | undefined {
  return getHeader(TUS_HEADERS.LOCATION)
}

export function tusReadUploadOffset(
  getHeader: (headerName: string) => string | undefined,
): TusNumericHeaderReadResult {
  return tusReadNumericHeader(getHeader, TUS_HEADERS.UPLOAD_OFFSET)
}

export function tusReadUploadLength(
  getHeader: (headerName: string) => string | undefined,
): TusNumericHeaderReadResult {
  return tusReadNumericHeader(getHeader, TUS_HEADERS.UPLOAD_LENGTH)
}

export function tusIsUploadLengthDeferred(
  getHeader: (headerName: string) => string | undefined,
): boolean {
  return getHeader(TUS_HEADERS.UPLOAD_DEFER_LENGTH) === '1'
}

export function tusReadUploadCreationResponse({
  getHeader,
  status,
}: {
  getHeader: (headerName: string) => string | undefined
  status: number
}): TusUploadCreationResponseReadResult {
  if (!tusIsSuccessfulResponseStatus(status)) {
    return { ok: false, reason: 'unexpectedStatus' }
  }

  const location = tusReadUploadLocation(getHeader)
  if (location == null) {
    return { ok: false, reason: 'missingLocation' }
  }

  return { ok: true, location }
}

export function tusReadUploadOffsetResponse({
  getHeader,
  protocol,
  status,
}: {
  getHeader: (headerName: string) => string | undefined
  protocol: string
  status: number
}): TusUploadOffsetResponseReadResult {
  if (!tusIsSuccessfulResponseStatus(status)) {
    return { ok: false, reason: 'unexpectedStatus' }
  }

  const offsetResult = tusReadUploadOffset(getHeader)
  if (!offsetResult.ok && offsetResult.reason === 'missing') {
    return { ok: false, reason: 'missingOffset' }
  }
  if (!offsetResult.ok) {
    return { ok: false, reason: 'invalidOffset' }
  }

  const uploadLengthDeferred = tusIsUploadLengthDeferred(getHeader)
  const lengthResult = tusReadUploadLength(getHeader)
  if (
    !lengthResult.ok &&
    !uploadLengthDeferred &&
    tusRequiresKnownUploadLengthOnOffsetResponse(protocol)
  ) {
    return { ok: false, reason: 'invalidLength' }
  }

  return {
    ok: true,
    length: lengthResult.ok ? lengthResult.value : null,
    offset: offsetResult.value,
    uploadLengthDeferred,
  }
}

export function tusReadUploadChunkResponse({
  getHeader,
  status,
}: {
  getHeader: (headerName: string) => string | undefined
  status: number
}): TusUploadChunkResponseReadResult {
  if (!tusIsSuccessfulResponseStatus(status)) {
    return { ok: false, reason: 'unexpectedStatus' }
  }

  const offsetResult = tusReadUploadOffset(getHeader)
  if (!offsetResult.ok && offsetResult.reason === 'missing') {
    return { ok: false, reason: 'missingOffset' }
  }
  if (!offsetResult.ok) {
    return { ok: false, reason: 'invalidOffset' }
  }

  return { ok: true, offset: offsetResult.value }
}
