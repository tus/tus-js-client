import BaseUpload from '../upload.js'
import NoopUrlStorage from '../noopUrlStorage.js'
import { enableDebugLog } from '../logger.js'
import DetailedError from '../error.js'

import { canStoreURLs, WebStorageUrlStorage } from './urlStorage.js'
import DefaultHttpStack from './httpStack.js'
import FileReader from './fileReader.js'
import fingerprint from './fileSignature.js'

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

/* eslint-disable no-restricted-globals, valid-typeof */
const isSupported =
  typeof self !== undefined &&
  'XMLHttpRequest' in self &&
  'Blob' in self &&
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
