import type { FileSource, SliceResult } from '../options.js'

/**
 * ArrayBufferViewFileSource implements FileSource for ArrayBufferView instances
 * (e.g. TypedArry or DataView).
 *
 * Note that the underlying ArrayBuffer should not change once passed to tus-js-client
 * or it will lead to weird behavior.
 */
export class ArrayBufferViewFileSource implements FileSource {
  private _view: ArrayBufferView

  size: number

  constructor(view: ArrayBufferView) {
    this._view = view
    this.size = view.byteLength
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
