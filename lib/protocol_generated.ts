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
  PARTIAL_UPLOAD: 'application/partial-upload',
} as const

export const TUS_HEADER_VALUES = {
  UPLOAD_COMPLETE_FALSE: '?0',
  UPLOAD_COMPLETE_TRUE: '?1',
  UPLOAD_CONCAT_FINAL_PREFIX: 'final;',
  UPLOAD_CONCAT_PARTIAL: 'partial',
  UPLOAD_DRAFT_INTEROP_VERSION_03: '5',
  UPLOAD_DRAFT_INTEROP_VERSION_05: '6',
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
