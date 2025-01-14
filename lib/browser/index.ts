import { DetailedError } from '../error.js'
import { enableDebugLog } from '../logger.js'
import { NoopUrlStorage } from '../noopUrlStorage.js'
import type { UploadInput, UploadOptions } from '../options.js'
import { BaseUpload, defaultOptions as baseDefaultOptions, terminate } from '../upload.js'

import { BrowserFileReader } from './fileReader.js'
import { fingerprint } from './fileSignature.js'
import { XHRHttpStack as DefaultHttpStack } from './httpStack.js'
import { WebStorageUrlStorage, canStoreURLs } from './urlStorage.js'

const defaultOptions = {
  ...baseDefaultOptions,
  httpStack: new DefaultHttpStack(),
  fileReader: new BrowserFileReader(),
  urlStorage: canStoreURLs ? new WebStorageUrlStorage() : new NoopUrlStorage(),
  fingerprint,
}

class Upload extends BaseUpload {
  constructor(file: UploadInput, options: Partial<UploadOptions> = {}) {
    const allOpts = { ...defaultOptions, ...options }
    super(file, allOpts)
  }

  static terminate(url: string, options: Partial<UploadOptions> = {}) {
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
