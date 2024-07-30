import DetailedError from '../error.js'
import { enableDebugLog } from '../logger.js'
import NoopUrlStorage from '../noopUrlStorage.js'
import BaseUpload from '../upload.js'

import FileReader from './fileReader.js'
import fingerprint from './fileSignature.js'
import DefaultHttpStack from './httpStack.js'
import StreamSource from './sources/StreamSource.js'
import { FileUrlStorage, canStoreURLs } from './urlStorage.js'

const defaultOptions = {
  ...BaseUpload.defaultOptions,
  httpStack: new DefaultHttpStack(),
  fileReader: new FileReader(),
  urlStorage: new NoopUrlStorage(),
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

// The Node.js environment does not have restrictions which may cause
// tus-js-client not to function.
const isSupported = true

export {
  Upload,
  defaultOptions,
  isSupported,
  // Make FileUrlStorage module available as it will not be set by default.
  FileUrlStorage,
  canStoreURLs,
  enableDebugLog,
  DefaultHttpStack,
  DetailedError,
  StreamSource,
}
