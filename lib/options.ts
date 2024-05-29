import type DetailedError from './error.js'

export const PROTOCOL_TUS_V1 = 'tus-v1'
export const PROTOCOL_IETF_DRAFT_03 = 'ietf-draft-03'

export interface UploadOptions<F, S> {
  // TODO: Embrace undefined over null
  endpoint: string | null

  uploadUrl: string | null
  metadata: { [key: string]: string }
  fingerprint: (file: F, options: UploadOptions<F, S>) => Promise<string | null>
  uploadSize: number | null

  onProgress: ((bytesSent: number, bytesTotal: number) => void) | null
  onChunkComplete: ((chunkSize: number, bytesAccepted: number, bytesTotal: number) => void) | null
  onSuccess: (() => void) | null
  onError: ((error: Error | DetailedError) => void) | null
  onShouldRetry:
    | ((error: DetailedError, retryAttempt: number, options: UploadOptions<F, S>) => boolean)
    | null
  onUploadUrlAvailable: (() => void) | null

  overridePatchMethod: boolean
  headers: { [key: string]: string }
  addRequestId: boolean
  onBeforeRequest: ((req: HttpRequest<S>) => void | Promise<void>) | null
  onAfterResponse: ((req: HttpRequest<S>, res: HttpResponse) => void | Promise<void>) | null

  chunkSize: number
  retryDelays: number[]
  parallelUploads: number
  parallelUploadBoundaries: { start: number; end: number }[] | null
  storeFingerprintForResuming: boolean
  removeFingerprintOnSuccess: boolean
  uploadLengthDeferred: boolean
  uploadDataDuringCreation: boolean

  urlStorage: UrlStorage
  fileReader: FileReader<F, S>
  httpStack: HttpStack<S>

  protocol: string
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

export interface FileReader<F, S> {
  openFile(input: F, chunkSize: number): Promise<FileSource<S>>
}

export interface FileSource<S> {
  size: number | null
  slice(start: number, end: number): Promise<SliceResult<S>>
  close(): void
}

export interface SliceResult<S> {
  // Platform-specific data type which must be usable by the HTTP stack as a body.
  // TODO: This should be a separate property and be set every time. Otherwise we track the wrong size.
  value: S & { size?: number }
  done: boolean
}

export interface HttpStack<B> {
  createRequest(method: string, url: string): HttpRequest<B>
  getName(): string
}

export type HttpProgressHandler = (bytesSent: number) => void

export interface HttpRequest<B> {
  getMethod(): string
  getURL(): string

  setHeader(header: string, value: string): void
  getHeader(header: string): string | undefined

  setProgressHandler(handler: HttpProgressHandler): void
  send(body?: B): Promise<HttpResponse>
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
