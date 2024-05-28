/* eslint no-unused-vars: "off" */

import type { UrlStorage } from './upload.js'

export default class NoopUrlStorage implements UrlStorage {
  findAllUploads() {
    return Promise.resolve([])
  }

  findUploadsByFingerprint() {
    return Promise.resolve([])
  }

  removeUpload() {
    return Promise.resolve(undefined)
  }

  addUpload() {
    return Promise.resolve(undefined)
  }
}
