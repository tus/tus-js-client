import DetailedError from '../error.js'
import { enableDebugLog } from '../logger.js'
import NoopUrlStorage from '../noopUrlStorage.js'
import BaseUpload from '../upload.js'

import FileReader from './fileReader.js'
import fingerprint from './fileSignature.js'
import DefaultHttpStack from './httpStack.js'
import { WebStorageUrlStorage, canStoreURLs } from './urlStorage.js'

const defaultOptions = {
  ...BaseUpload.defaultOptions,
  httpStack: new DefaultHttpStack(),
  fileReader: new FileReader(),
  urlStorage: canStoreURLs ? new WebStorageUrlStorage() : new NoopUrlStorage(),
  fingerprint,
}

class Upload extends BaseUpload {
  constructor(file = null, options = {}) {
    options = { ...defaultOptions, ...options }
    super(file, options)
  }

  static terminate(url, options = {}) {
    options = { ...defaultOptions, ...options }
    return BaseUpload.terminate(url, options)
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
