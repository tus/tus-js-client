/* eslint no-unused-vars: "off" */

export default class NoopUrlStorage {
  listAllUploads() {
    return Promise.resolve([]);
  }

  findUploadsByFingerprint(fingerprint) {
    return Promise.resolve([]);
  }

  removeUpload(urlStorageKey) {
    return Promise.resolve();
  }

  addUpload(fingerprint, upload) {
    return Promise.resolve(null);
  }
}
