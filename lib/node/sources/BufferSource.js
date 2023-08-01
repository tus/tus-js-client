export default class BufferSource {
  constructor(buffer) {
    this._buffer = buffer
    this.size = buffer.length
  }

  slice(start, end) {
    const value = this._buffer.slice(start, end)
    value.size = value.length
    const done = end >= this.size
    return Promise.resolve({ value, done })
  }

  close() {}
}
