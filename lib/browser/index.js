import BaseUpload from '../upload'
import NoopUrlStorage from '../noopUrlStorage'
import { enableDebugLog } from '../logger'

import { canStoreURLs, WebStorageUrlStorage } from './urlStorage'
import HttpStack from './httpStack'
import FileReader from './fileReader'
import fingerprint from './fingerprint'

const defaultOptions = {
  ...BaseUpload.defaultOptions,
  httpStack : new HttpStack(),
  fileReader: new FileReader(),
  urlStorage: (canStoreURLs ? new WebStorageUrlStorage() : new NoopUrlStorage()),
  fingerprint,
}

class Upload extends BaseUpload {
  constructor (file = null, options = {}) {
    super(file, { ...defaultOptions, ...options })
  }

  static terminate (url, options, cb) {
    return BaseUpload.terminate(url, { ...defaultOptions, ...options }, cb)
  }
}

const { XMLHttpRequest, Blob } = window

const isSupported = (
  XMLHttpRequest
  && Blob
  && typeof Blob.prototype.slice === 'function'
)

export {
  Upload,
  canStoreURLs,
  defaultOptions,
  isSupported,
  enableDebugLog,
  HttpStack,
}
