import type { ReadStream } from 'node:fs'
import type { Readable } from 'node:stream'
import { DetailedError } from '../error.js'
import { enableDebugLog } from '../logger.js'
import { NoopUrlStorage } from '../noopUrlStorage.js'
import type { UploadInput, UploadOptions } from '../options.js'
import { BaseUpload, defaultOptions as baseDefaultOptions, terminate } from '../upload.js'

import { NodeFileReader } from './fileReader.js'
import { fingerprint } from './fileSignature.js'
import { NodeHttpStack as DefaultHttpStack } from './httpStack.js'
import { canStoreURLs } from './urlStorage.js'

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

// Note: The exported interface must be the same as in lib/browser/index.ts.
// Any changes should be reflected in both files.
export { Upload, defaultOptions, isSupported, canStoreURLs, enableDebugLog, DetailedError }
