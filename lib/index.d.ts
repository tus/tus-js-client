// Type definitions for tus-js-client

export const isSupported: boolean;
export const canStoreURLs: boolean;
export const defaultOptions: UploadOptions;

export class Upload {
  constructor(file: File | Blob | Pick<ReadableStreamDefaultReader, "read">, options: UploadOptions);

  file: File | Blob | Pick<ReadableStreamDefaultReader, "read">;
  options: UploadOptions;
  url: string | null;

  static terminate(url: string, options?: UploadOptions): Promise<void>;
  start(): void;
  abort(shouldTerminate?: boolean): Promise<void>;
  findPreviousUploads(): Promise<PreviousUpload[]>;

  resumeFromPreviousUpload(previousUpload: PreviousUpload): void;
}

interface UploadOptions {
  endpoint?: string | null;

  uploadUrl?: string | null;
  metadata?: { [key: string]: string };
  fingerprint?: (file: File, options?: UploadOptions) => Promise<string>;
  uploadSize?: number | null;

  onProgress?: ((bytesSent: number, bytesTotal: number) => void) | null;
  onChunkComplete?: ((chunkSize: number, bytesAccepted: number, bytesTotal: number) => void) | null;
  onSuccess?: (() => void) | null;
  onError?: ((error: Error) => void) | null;

  overridePatchMethod?: boolean;
  headers?: { [key: string]: string };
  addRequestId?: boolean;
  onBeforeRequest?: (req: HttpRequest) => void;
  onAfterResponse?: (req: HttpRequest, res: HttpResponse) => void;

  chunkSize?: number;
  retryDelays?: number[];
  parallelUploads?: number;
  storeFingerprintForResuming?: boolean;  removeFingerprintOnSuccess?: boolean;
  uploadLengthDeferred?: boolean;
  uploadDataDuringCreation?: boolean;

  urlStorage?: UrlStorage;
  fileReader?: FileReader;
  httpStack?: HttpStack;
}

interface UrlStorage {
  findAllUploads(): Promise<PreviousUpload[]>;
  findUploadsByFingerprint(fingerprint: string): Promise<PreviousUpload[]>;

  removeUpload(urlStorageKey: string): Promise<void>;

  // Returns the URL storage key, which can be used for removing the upload.
  addUpload(fingerprint: string, upload: PreviousUpload): Promise<string>;
}

interface PreviousUpload {
  size: number | null;
  metadata: { [key: string]: string };
  creationTime: string;
}

interface FileReader {
  openFile(input: any, chunkSize: number): Promise<FileSource>;
}

interface FileSource {
  size: number;
  slice(start: number, end: number): Promise<SliceResult>;
  close(): void;
}

interface SliceResult {
  // Platform-specific data type which must be usable by the HTTP stack as a body.
  value: any;
  done: boolean;
}

export interface HttpStack {
  createRequest(method: string, url: string): HttpRequest;
  getName(): string;
}

export interface HttpRequest {
  getMethod(): string;
  getURL(): string;

  setHeader(header: string, value: string): void;
  getHeader(header: string): string;

  setProgressHandler(handler: (bytesSent: number) => void): void;
  send(body: any): Promise<HttpResponse>;
  abort(): Promise<void>;

  // Return an environment specific object, e.g. the XMLHttpRequest object in browsers.
  getUnderlyingObject(): any;
}

export interface HttpResponse {
  getStatus(): number;
  getHeader(header: string): string;
  getBody(): string;

  // Return an environment specific object, e.g. the XMLHttpRequest object in browsers.
  getUnderlyingObject(): any;
}
