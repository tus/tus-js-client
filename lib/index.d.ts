// Type definitions for tus-js-client

export const isSupported: boolean
export const canStoreURLs: boolean
export const defaultOptions: UploadOptions &
  Required<Pick<UploadOptions, 'httpStack' | 'fileReader' | 'urlStorage' | 'fingerprint'>>

// TODO: Consider using { read: () => Promise<{ done: boolean; value?: any; }>; } as type
export class Upload {
  constructor(
    file: File | Blob | Buffer | Pick<ReadableStreamDefaultReader, 'read'>,
    options: UploadOptions,
  )

  file: File | Blob | Buffer | Pick<ReadableStreamDefaultReader, 'read'>
  options: UploadOptions
  url: string | null

  static terminate(url: string, options?: UploadOptions): Promise<void>
  start(): void
  abort(shouldTerminate?: boolean): Promise<void>
  findPreviousUploads(): Promise<PreviousUpload[]>

  resumeFromPreviousUpload(previousUpload: PreviousUpload): void
}

interface UploadOptions {
  endpoint?: string | null

  uploadUrl?: string | null
  metadata?: { [key: string]: string }
  metadataForPartialUploads?: { [key: string]: string }
  fingerprint?: (file: File, options: UploadOptions) => Promise<string>
  uploadSize?: number | null

  onProgress?: ((bytesSent: number, bytesTotal: number) => void) | null
  onChunkComplete?: ((chunkSize: number, bytesAccepted: number, bytesTotal: number) => void) | null
  onSuccess?: ((payload: OnSuccessPayload) => void) | null
  onError?: ((error: Error | DetailedError) => void) | null
  onShouldRetry?:
    | ((error: DetailedError, retryAttempt: number, options: UploadOptions) => boolean)
    | null
  onUploadUrlAvailable?: (() => void) | null

  overridePatchMethod?: boolean
  headers?: { [key: string]: string }
  addRequestId?: boolean
  onBeforeRequest?: (req: HttpRequest) => void | Promise<void>
  onAfterResponse?: (req: HttpRequest, res: HttpResponse) => void | Promise<void>

  chunkSize?: number
  retryDelays?: number[] | null
  parallelUploads?: number
  parallelUploadBoundaries?: { start: number; end: number }[] | null
  storeFingerprintForResuming?: boolean
  removeFingerprintOnSuccess?: boolean
  uploadLengthDeferred?: boolean
  uploadDataDuringCreation?: boolean

  urlStorage?: UrlStorage
  fileReader?: FileReader
  httpStack?: HttpStack
}

interface OnSuccessPayload {
  lastResponse: HttpResponse
}

interface UrlStorage {
  findAllUploads(): Promise<PreviousUpload[]>
  findUploadsByFingerprint(fingerprint: string): Promise<PreviousUpload[]>

  removeUpload(urlStorageKey: string): Promise<void>

  // Returns the URL storage key, which can be used for removing the upload.
  addUpload(fingerprint: string, upload: PreviousUpload): Promise<string>
}

interface PreviousUpload {
  size: number | null
  metadata: { [key: string]: string }
  creationTime: string
  urlStorageKey: string
  uploadUrl: string | null
  parallelUploadUrls: string[] | null
}

interface FileReader {
  openFile(input: any, chunkSize: number): Promise<FileSource>
}

interface FileSource {
  size: number
  slice(start: number, end: number): Promise<SliceResult>
  close(): void
}

interface SliceResult {
  // Platform-specific data type which must be usable by the HTTP stack as a body.
  value: any
  done: boolean
}

export class DefaultHttpStack implements HttpStack {
  constructor(options: any)
  createRequest(method: string, url: string): HttpRequest
  getName(): string
}

export interface HttpStack {
  createRequest(method: string, url: string): HttpRequest
  getName(): string
}

export interface HttpRequest {
  getMethod(): string
  getURL(): string

  setHeader(header: string, value: string): void
  getHeader(header: string): string | undefined

  setProgressHandler(handler: (bytesSent: number) => void): void
  send(body: any): Promise<HttpResponse>
  abort(): Promise<void>

  // Return an environment specific object, e.g. the XMLHttpRequest object in browsers.
  getUnderlyingObject(): any
}

export interface HttpResponse {
  getStatus(): number
  getHeader(header: string): string | undefined
  getBody(): string

  // Return an environment specific object, e.g. the XMLHttpRequest object in browsers.
  getUnderlyingObject(): any
}

export class DetailedError extends Error {
  originalRequest: HttpRequest
  originalResponse: HttpResponse | null
  causingError: Error | null
}
