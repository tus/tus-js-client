/* eslint no-unused-vars: "off" */

import { UrlStorage } from './upload'

export default class NoopUrlStorage implements UrlStorage {
  findAllUploads() {
    return Promise.resolve([])
  }

  findUploadsByFingerprint() {
    return Promise.resolve([])
  }

  removeUpload() {
    return Promise.resolve()
  }

  addUpload() {
    return Promise.resolve()
  }
}
