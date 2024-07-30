export default class NoopUrlStorage {
  listAllUploads() {
    return Promise.resolve([])
  }

  findUploadsByFingerprint(_fingerprint) {
    return Promise.resolve([])
  }

  removeUpload(_urlStorageKey) {
    return Promise.resolve()
  }

  addUpload(_fingerprint, _upload) {
    return Promise.resolve(null)
  }
}
