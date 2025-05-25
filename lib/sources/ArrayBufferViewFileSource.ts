import type { FileSource, SliceResult, UploadOptions } from '../options.js'

/**
 * ArrayBufferViewFileSource implements FileSource for ArrayBufferView instances
 * (e.g., TypedArray or DataView).
 *
 * Note that the underlying ArrayBuffer should not change once passed to tus-js-client
 * or it will lead to weird behavior.
 */
export class ArrayBufferViewFileSource implements FileSource {
  private readonly _view: ArrayBufferView

  size: number

  constructor(view: ArrayBufferView) {
    this._view = view
    this.size = view.byteLength
  }

  async fingerprint(options: UploadOptions): Promise<string | null> {
    const buffer = this._view.buffer.slice(this._view.byteOffset, this._view.byteOffset + this._view.byteLength);
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashContent = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    return Promise.resolve([hashContent, options.endpoint, options.projectId].join('-'));
  }

  slice(start: number, end: number): Promise<SliceResult> {
    const buffer = this._view.buffer
    const startInBuffer = this._view.byteOffset + start
    end = Math.min(end, this.size) // ensure end is finite and not greater than size
    const byteLength = end - start

    // Use DataView instead of ArrayBuffer.slice to avoid copying the buffer.
    const value = new DataView(buffer, startInBuffer, byteLength)
    const size = value.byteLength
    const done = end >= this.size

    return Promise.resolve({ value, size, done })
  }

  close() {
    // Nothing to do here since we don't need to release any resources.
  }
}
