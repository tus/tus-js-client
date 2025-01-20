import type { PreviousUpload, UrlStorage } from '../options.js'

let hasStorage = false
try {
  // Note: localStorage does not exist in the Web Worker's context, so we must use window here.
  hasStorage = 'localStorage' in window

  // Attempt to store and read entries from the local storage to detect Private
  // Mode on Safari on iOS (see #49)
  // If the key was not used before, we remove it from local storage again to
  // not cause confusion where the entry came from.
  const key = 'tusSupport'
  const originalValue = localStorage.getItem(key)
  localStorage.setItem(key, String(originalValue))
  if (originalValue == null) localStorage.removeItem(key)
} catch (e: unknown) {
  // If we try to access localStorage inside a sandboxed iframe, a SecurityError
  // is thrown. When in private mode on iOS Safari, a QuotaExceededError is
  // thrown (see #49)
  // TODO: Replace `code` with `name`
  if (e instanceof DOMException && (e.code === e.SECURITY_ERR || e.code === e.QUOTA_EXCEEDED_ERR)) {
    hasStorage = false
  } else {
    throw e
  }
}

export const canStoreURLs = hasStorage

export class WebStorageUrlStorage implements UrlStorage {
  findAllUploads(): Promise<PreviousUpload[]> {
    const results = this._findEntries('tus::')
    return Promise.resolve(results)
  }

  findUploadsByFingerprint(fingerprint: string): Promise<PreviousUpload[]> {
    const results = this._findEntries(`tus::${fingerprint}::`)
    return Promise.resolve(results)
  }

  removeUpload(urlStorageKey: string): Promise<void> {
    localStorage.removeItem(urlStorageKey)
    return Promise.resolve()
  }

  addUpload(fingerprint: string, upload: PreviousUpload): Promise<string> {
    const id = Math.round(Math.random() * 1e12)
    const key = `tus::${fingerprint}::${id}`

    localStorage.setItem(key, JSON.stringify(upload))
    return Promise.resolve(key)
  }

  private _findEntries(prefix: string): PreviousUpload[] {
    const results: PreviousUpload[] = []

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key == null) {
        throw new Error(`didn't find key for item ${i}`)
      }

      // Ignore entires that are not from tus-js-client
      if (key.indexOf(prefix) !== 0) continue

      const item = localStorage.getItem(key)
      if (item == null) {
        throw new Error(`didn't find item for key ${key}`)
      }

      try {
        const upload = JSON.parse(item)
        upload.urlStorageKey = key

        results.push(upload)
      } catch (_e) {
        // The JSON parse error is intentionally ignored here, so a malformed
        // entry in the storage cannot prevent an upload.
      }
    }

    return results
  }
}
