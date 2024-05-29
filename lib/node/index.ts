import type { ReadStream } from 'node:fs'
import type { Readable } from 'node:stream'
import DetailedError from '../error.js'
import { enableDebugLog } from '../logger.js'
import NoopUrlStorage from '../noopUrlStorage.js'
import type { UploadOptions } from '../options.js'
import BaseUpload, { terminate, defaultOptions as baseDefaultOptions } from '../upload.js'

import FileReader from './fileReader.js'
import fingerprint from './fileSignature.js'
import DefaultHttpStack from './httpStack.js'
import StreamSource from './sources/StreamSource.js'
import { FileUrlStorage, canStoreURLs } from './urlStorage.js'

const defaultOptions = {
  ...baseDefaultOptions,
  httpStack: new DefaultHttpStack(),
  fileReader: new FileReader(),
  urlStorage: new NoopUrlStorage(),
  fingerprint,
}

export type FileTypes = Buffer | Readable | ReadStream
export type FileSliceTypes = Buffer | ReadStream

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

// The Node.js environment does not have restrictions which may cause
// tus-js-client not to function.
const isSupported = true

// The usage of the commonjs exporting syntax instead of the new ECMAScript
// one is actually inteded and prevents weird behaviour if we are trying to
// import this module in another module using Babel.
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
