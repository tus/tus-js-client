import type { FileSource } from '../../options.js'

export class BufferFileSource implements FileSource {
  size: number

  private _buffer: Buffer

  constructor(buffer: Buffer) {
    this._buffer = buffer
    this.size = buffer.length
  }

  slice(start: number, end: number) {
    const value: Buffer & { size?: number } = this._buffer.slice(start, end)
    value.size = value.length
    const done = end >= this.size
    return Promise.resolve({ value, done })
  }

  close() {}
}
