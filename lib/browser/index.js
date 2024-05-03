import BaseUpload from '../upload.js'
import NoopUrlStorage from '../noopUrlStorage.js'
import { enableDebugLog } from '../logger.js'
import DetailedError from '../error.js'

import { canStoreURLs, WebStorageUrlStorage } from './urlStorage.js'
import {IndexedDBUrlStorage,canStoreURLsInIndexedDB} from './urlStorageIndexedDB.js'
import DefaultHttpStack from './httpStack.js'
import FileReader from './fileReader.js'
import fingerprint from './fileSignature.js'

const getUrlStorage=(useIndexedDBForUrlStorage)=>{
  if(useIndexedDBForUrlStorage && canStoreURLsInIndexedDB){
    return new IndexedDBUrlStorage()
  }
  return canStoreURLs ? new WebStorageUrlStorage() : new NoopUrlStorage()
}

const defaultOptions = {
  ...BaseUpload.defaultOptions,
  httpStack: new DefaultHttpStack(),
  fileReader: new FileReader(),
  urlStorage: canStoreURLs ? new WebStorageUrlStorage() : new NoopUrlStorage(),
  fingerprint,
}

class Upload extends BaseUpload {
  constructor(file = null, options = {}) {
    options = { ...defaultOptions, ...options, urlStorage: getUrlStorage(options.useIndexedDBForUrlStorage) }
    super(file, options)
  }

  static terminate(url, options = {}) {
    options = { ...defaultOptions, ...options, urlStorage: getUrlStorage(options.useIndexedDBForUrlStorage) }
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
  canStoreURLsInIndexedDB,
  defaultOptions,
  isSupported,
  enableDebugLog,
  DefaultHttpStack,
  DetailedError,
}
