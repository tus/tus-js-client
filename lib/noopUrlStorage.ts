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
