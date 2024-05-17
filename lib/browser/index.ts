import BaseUpload, {
  defaultOptions as baseDefaultOptions,
  terminate,
  UploadOptions,
} from '../upload.js'
import NoopUrlStorage from '../noopUrlStorage.js'
import { enableDebugLog } from '../logger.js'
import DetailedError from '../error.js'

import { canStoreURLs, WebStorageUrlStorage } from './urlStorage.js'
import DefaultHttpStack from './httpStack.js'
import BrowserFileReader from './fileReader.js'
import fingerprint from './fileSignature.js'

const defaultOptions = {
  ...baseDefaultOptions,
  httpStack: new DefaultHttpStack(),
  fileReader: new BrowserFileReader(),
  urlStorage: canStoreURLs ? new WebStorageUrlStorage() : new NoopUrlStorage(),
  fingerprint,
}

// ReactNativeFile describes the structure that is returned from the
// Expo image picker (see https://docs.expo.dev/versions/latest/sdk/imagepicker/)
// TODO: Should these properties be fileName and fileSize instead?
// TODO: What about other file pickers without Expo?
export interface ReactNativeFile {
  uri: string
  name?: string
  size?: string
  exif?: Record<string, unknown>
}

export type FileTypes = ReactNativeFile | Blob | ReadableStreamDefaultReader
export type FileSliceTypes = Blob | Uint8Array

class Upload extends BaseUpload<FileTypes, FileSliceTypes> {
  constructor(file: FileTypes, options: Partial<UploadOptions<FileTypes, FileSliceTypes>> = {}) {
    const allOpts = { ...defaultOptions, ...options }
    super(file, allOpts)
  }

  static terminate(url: string, options: Partial<UploadOptions<FileTypes, FileSliceTypes>> = {}) {
    const allOpts = { ...defaultOptions, ...options }
    return terminate(url, allOpts)
  }
}

// Note: We don't reference `window` here because these classes also exist in a Web Worker's context.
const isSupported =
  typeof XMLHttpRequest === 'function' &&
  typeof Blob === 'function' &&
  typeof Blob.prototype.slice === 'function'

export {
  Upload,
  canStoreURLs,
  defaultOptions,
  isSupported,
  enableDebugLog,
  DefaultHttpStack,
  DetailedError,
}
