import type { Readable as NodeReadableStream } from 'node:stream'
import type { DetailedError } from './DetailedError.js'

export const PROTOCOL_TUS_V1 = 'tus-v1'
export const PROTOCOL_IETF_DRAFT_03 = 'ietf-draft-03'
export const PROTOCOL_IETF_DRAFT_05 = 'ietf-draft-05'

/**
 * ReactNativeFile describes the structure that is returned from the
 * Expo image picker (see https://docs.expo.dev/versions/latest/sdk/imagepicker/)
 * TODO: Should these properties be fileName and fileSize instead?
 * TODO: What about other file pickers without Expo?
 * TODO: Should this be renamed to Expo?
 * TODO: Only size is relevant for us. Not the rest.
 */
export interface ReactNativeFile {
  uri: string
  name?: string
  size?: string
  exif?: Record<string, unknown>
}

/**
 * PathReference is a reference to a file on disk. Currently, it's only supported
 * in Node.js. It can be supplied as a normal object or as an instance of `fs.ReadStream`,
 * which also satisfies this interface.
 *
 * Optionally, a start and/or end position can be defined to define a range of bytes from
 * the file that should be uploaded instead of the entire file. Both start and end are
 * inclusive and start counting at 0, similar to the options accepted by `fs.createReadStream`.
 */
export interface PathReference {
  path: string | Buffer
  start?: number
  end?: number
}

export type UploadInput =
  // available in all environments
  | Blob // includes File
  | ArrayBuffer
  | SharedArrayBuffer
  | ArrayBufferView // includes Node.js' Buffer
  | ReadableStream // Web Streams
  // available in Node.js
  | NodeReadableStream
  | PathReference
  // available in React Native
  | ReactNativeFile

export interface UploadOptions {
  endpoint?: string

  projectId?: string

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
  onUploadUrlAvailable?: () => void | Promise<void>

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
  urlStorageKey: string
}

export interface FileReader {
  openFile(input: UploadInput, chunkSize: number): Promise<FileSource>
}

export interface FileSource {
  size: number | null
  slice(start: number, end: number): Promise<SliceResult>
  close(): void
  fingerprint(options: UploadOptions): Promise<string | null>
}

// TODO: Allow Web Streams' ReadableStream as well
export type SliceType = Blob | ArrayBufferView | NodeReadableStream

export type SliceResult =
  | {
      done: true
      value: null
      size: null
    }
  | {
      done: boolean
      value: NonNullable<SliceType>
      // TODO: How should sizes be handled? If we want to allow `slice()` to return
      // streams without buffering them before, this cannot return a known size.
      // Should size be returned by the HTTP stack based on the number of uploaded bytes?
      // It would make sense since it likely already counts progress.
      size: number
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
  send(body?: SliceType): Promise<HttpResponse>
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
