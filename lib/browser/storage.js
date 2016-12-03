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

export function setItem(key, value) {
  if (!hasStorage) return;
  return localStorage.setItem(key, value);
}

export function getItem(key) {
  if (!hasStorage) return;
  return localStorage.getItem(key);
}

export function removeItem(key) {
  if (!hasStorage) return;
  return localStorage.removeItem(key);
}
