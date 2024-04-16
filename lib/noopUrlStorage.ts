/* eslint no-unused-vars: "off" */

import { UrlStorage } from './upload'

export default class NoopUrlStorage implements UrlStorage {
  findAllUploads() {
    return Promise.resolve([])
  }

  findUploadsByFingerprint(fingerprint) {
    return Promise.resolve([])
  }

  removeUpload(urlStorageKey) {
    return Promise.resolve()
  }

  addUpload(fingerprint, upload) {
    return Promise.resolve()
  }
}
