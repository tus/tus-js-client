// This file is generated from Transloadit API2 TUS protocol contracts. If it looks wrong,
// please report the issue instead of editing this file by hand; the source fix
// belongs in the protocol contract generator so all TUS clients stay in sync.

import type { PreviousUpload, UrlStorage } from './options.js'

export class NoopUrlStorage implements UrlStorage {
  findAllUploads() {
    return Promise.resolve([])
  }

  findUploadsByFingerprint(_fingerprint: string) {
    return Promise.resolve([])
  }

  removeUpload(_urlStorageKey: string) {
    return Promise.resolve()
  }

  addUpload(_urlStorageKey: string, _upload: PreviousUpload) {
    return Promise.resolve(undefined)
  }
}
