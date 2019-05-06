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

class LocalStorage {
  setItem(key, value, cb) {
    cb(null, localStorage.setItem(key, value));
  }

  getItem(key, cb) {
    cb(null, localStorage.getItem(key));
  }

  removeItem(key, cb) {
    cb(null, localStorage.removeItem(key));
  }
}

export function getStorage() {
  return hasStorage ? new LocalStorage() : null;
}
