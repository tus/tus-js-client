import type { ReadStream } from 'node:fs'
import type { Readable } from 'node:stream'
import DetailedError from '../error.js'
import { enableDebugLog } from '../logger.js'
import NoopUrlStorage from '../noopUrlStorage.js'
import type { UploadInput, UploadOptions } from '../options.js'
import BaseUpload, { terminate, defaultOptions as baseDefaultOptions } from '../upload.js'

import NodeFileReader from './fileReader.js'
import fingerprint from './fileSignature.js'
import DefaultHttpStack from './httpStack.js'
import StreamFileSource from './sources/StreamFileSource.js'
import { FileUrlStorage, canStoreURLs } from './urlStorage.js'

const defaultOptions = {
  ...baseDefaultOptions,
  httpStack: new DefaultHttpStack(),
  fileReader: new NodeFileReader(),
  urlStorage: new NoopUrlStorage(),
  fingerprint,
}

export type FileTypes = Buffer | Readable | ReadStream
export type FileSliceTypes = Buffer | ReadStream

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
  StreamFileSource as StreamSource,
}
