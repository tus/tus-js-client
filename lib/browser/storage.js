/* global window, localStorage */

let hasStorage = false;
try {
  hasStorage = "localStorage" in window;
  // Attempt to access localStorage
  localStorage.length;
} catch (e) {
  // If we try to access localStorage inside a sandboxed iframe, a SecurityError
  // is thrown.
  if (e.code === e.SECURITY_ERR) {
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
