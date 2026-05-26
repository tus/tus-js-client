// This file is generated from Transloadit API2 TUS protocol contracts. If it looks wrong,
// please report the issue instead of editing this file by hand; the source fix
// belongs in the protocol contract generator so all TUS clients stay in sync.

export const TUS_DEFAULT_PROTOCOL_VERSION = '1.0.0'

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

export const TUS_SUPPORTED_PROTOCOLS: readonly string[] = [
  'tus-v1',
  'ietf-draft-03',
  'ietf-draft-05',
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

export function tusRequestHeadersForProtocol(protocol: string): Record<string, string> {
  return { ...(TUS_PROTOCOL_REQUEST_HEADERS[protocol] ?? {}) }
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
