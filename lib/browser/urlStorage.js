/* global window, localStorage */

let hasStorage = false;
try {
  hasStorage = "localStorage" in window;

  // Attempt to store and read entries from the local storage to detect Private
  // Mode on Safari on iOS (see #49)
  var key = "tusSupport";
  localStorage.setItem(key, localStorage.getItem(key));

} catch (e) {
  // If we try to access localStorage inside a sandboxed iframe, a SecurityError
  // is thrown. When in private mode on iOS Safari, a QuotaExceededError is
  // thrown (see #49)
  if (e.code === e.SECURITY_ERR || e.code === e.QUOTA_EXCEEDED_ERR) {
    hasStorage = false;
  } else {
    throw e;
  }
}

export const canStoreURLs = hasStorage;

export class WebStorageUrlStorage {
  findAllUploads() {
    const results = this._findEntries("tus::");
    return Promise.resolve(results);
  }

  findUploadsByFingerprint(fingerprint) {
    const results = this._findEntries(`tus::${fingerprint}::`);
    return Promise.resolve(results);
  }

  removeUpload(urlStorageKey) {
    localStorage.removeItem(urlStorageKey);
    return Promise.resolve();
  }

  addUpload(fingerprint, upload) {
    const id = Math.round(Math.random() * 1e12);
    const key = `tus::${fingerprint}::${id}`;

    localStorage.setItem(key, JSON.stringify(upload));
    return Promise.resolve(key);
  }

  _findEntries(prefix) {
    const results = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.indexOf(prefix) !== 0) continue;

      try {
        let upload = JSON.parse(localStorage.getItem(key));
        upload.urlStorageKey = key;

        results.push(upload);
      } catch (e) {
        // The JSON parse error is intentionally ignored here, so a malformed
        // entry in the storage cannot prevent an upload.
      }
    }

    return results;
  }
}
