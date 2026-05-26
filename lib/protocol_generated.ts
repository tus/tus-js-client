// This file is generated from Transloadit API2 TUS protocol contracts. If it looks wrong,
// please report the issue instead of editing this file by hand; the source fix
// belongs in the protocol contract generator so all TUS clients stay in sync.

export const TUS_DEFAULT_PROTOCOL_VERSION = '1.0.0'

export const TUS_DEFAULT_CLIENT_PROTOCOL = 'tus-v1'

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

export const TUS_PROTOCOL_CHUNK_CONTENT_TYPES: Record<string, string> = {
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

export function tusChunkContentTypeForProtocol(protocol: string): string | undefined {
  return TUS_PROTOCOL_CHUNK_CONTENT_TYPES[protocol]
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
  const contentType = tusChunkContentTypeForProtocol(protocol)

  return {
    ...(contentType ? { [TUS_HEADERS.CONTENT_TYPE]: contentType } : {}),
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
