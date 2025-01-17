import type { ReadStream } from 'node:fs'
import type { Readable } from 'node:stream'
import type { DetailedError } from './DetailedError.js'

export const PROTOCOL_TUS_V1 = 'tus-v1'
export const PROTOCOL_IETF_DRAFT_03 = 'ietf-draft-03'
export const PROTOCOL_IETF_DRAFT_05 = 'ietf-draft-05'

// ReactNativeFile describes the structure that is returned from the
// Expo image picker (see https://docs.expo.dev/versions/latest/sdk/imagepicker/)
// TODO: Should these properties be fileName and fileSize instead?
// TODO: What about other file pickers without Expo?
// TODO: Should this be renamed to Expo?
export interface ReactNativeFile {
  uri: string
  name?: string
  size?: string
  exif?: Record<string, unknown>
}

export type UploadInput =
  // Blob, File, ReadableStreamDefaultReader are available in browsers and Node.js
  | Blob
  | File
  // TODO: Should we keep the Pick<> here?
  | Pick<ReadableStreamDefaultReader, 'read'>
  // Buffer, stream.Readable, fs.ReadStream are available in Node.js
  | Buffer
  | Readable
  | ReadStream
  // ReactNativeFile is intended for React Native apps
  | ReactNativeFile

export interface UploadOptions {
  endpoint?: string

  uploadUrl?: string
  metadata: { [key: string]: string }
  metadataForPartialUploads: UploadOptions['metadata']
  fingerprint: (file: UploadInput, options: UploadOptions) => Promise<string | null>
  uploadSize?: number

  onProgress?: (bytesSent: number, bytesTotal: number | null) => void
  onChunkComplete?: (chunkSize: number, bytesAccepted: number, bytesTotal: number | null) => void
  onSuccess?: (payload: OnSuccessPayload) => void
  onError?: (error: Error | DetailedError) => void
  onShouldRetry?: (error: DetailedError, retryAttempt: number, options: UploadOptions) => boolean
  onUploadUrlAvailable?: () => void

  overridePatchMethod: boolean
  headers: { [key: string]: string }
  addRequestId: boolean
  onBeforeRequest?: (req: HttpRequest) => void | Promise<void>
  onAfterResponse?: (req: HttpRequest, res: HttpResponse) => void | Promise<void>

  chunkSize: number
  retryDelays: number[]
  parallelUploads: number
  parallelUploadBoundaries?: { start: number; end: number }[]
  storeFingerprintForResuming: boolean
  removeFingerprintOnSuccess: boolean
  uploadLengthDeferred: boolean
  uploadDataDuringCreation: boolean

  urlStorage: UrlStorage
  fileReader: FileReader
  httpStack: HttpStack

  protocol: typeof PROTOCOL_TUS_V1 | typeof PROTOCOL_IETF_DRAFT_03 | typeof PROTOCOL_IETF_DRAFT_05
}

export interface OnSuccessPayload {
  lastResponse: HttpResponse
}

export interface UrlStorage {
  findAllUploads(): Promise<PreviousUpload[]>
  findUploadsByFingerprint(fingerprint: string): Promise<PreviousUpload[]>

  removeUpload(urlStorageKey: string): Promise<void>

  // Returns the URL storage key, which can be used for removing the upload.
  addUpload(fingerprint: string, upload: PreviousUpload): Promise<string | undefined>
}

export interface PreviousUpload {
  size: number | null
  metadata: { [key: string]: string }
  creationTime: string
  uploadUrl?: string
  parallelUploadUrls?: string[]
}

export interface FileReader {
  openFile(input: UploadInput, chunkSize: number): Promise<FileSource>
}

export interface FileSource {
  size: number | null
  slice(start: number, end: number): Promise<SliceResult>
  close(): void
}

export interface SliceResult {
  // Platform-specific data type which must be usable by the HTTP stack as a body.
  // TODO: This should be a separate property and be set every time. Otherwise we track the wrong size.
  value: unknown & { size?: number }
  done: boolean
}

export interface HttpStack {
  createRequest(method: string, url: string): HttpRequest
  getName(): string
}

export type HttpProgressHandler = (bytesSent: number) => void

export interface HttpRequest {
  getMethod(): string
  getURL(): string

  setHeader(header: string, value: string): void
  getHeader(header: string): string | undefined

  setProgressHandler(handler: HttpProgressHandler): void
  // TODO: Should this be something like { value: unknown, size: number }?
  send(body?: unknown): Promise<HttpResponse>
  abort(): Promise<void>

  // Return an environment specific object, e.g. the XMLHttpRequest object in browsers.
  getUnderlyingObject(): unknown
}

export interface HttpResponse {
  getStatus(): number
  getHeader(header: string): string | undefined
  getBody(): string

  // Return an environment specific object, e.g. the XMLHttpRequest object in browsers.
  getUnderlyingObject(): unknown
}
