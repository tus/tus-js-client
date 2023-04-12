function len(blobOrArray) {
  if (blobOrArray === undefined) return 0
  if (blobOrArray.size !== undefined) return blobOrArray.size
  return blobOrArray.length
}

/*
  Typed arrays and blobs don't have a concat method.
  This function helps StreamSource accumulate data to reach chunkSize.
*/
function concat(a, b) {
  if (a.concat) {
    // Is `a` an Array?
    return a.concat(b)
  }
  if (a instanceof Blob) {
    return new Blob([a, b], { type: a.type })
  }
  if (a.set) {
    // Is `a` a typed array?
    const c = new a.constructor(a.length + b.length)
    c.set(a)
    c.set(b, a.length)
    return c
  }
  throw new Error('Unknown data type')
}

export default class StreamSource {
  constructor(reader) {
    this._buffer = undefined
    this._bufferOffset = 0
    this._reader = reader
    this._done = false
  }

  slice(start, end) {
    if (start < this._bufferOffset) {
      return Promise.reject(new Error("Requested data is before the reader's current offset"))
    }

    return this._readUntilEnoughDataOrDone(start, end)
  }

  _readUntilEnoughDataOrDone(start, end) {
    const hasEnoughData = end <= this._bufferOffset + len(this._buffer)
    if (this._done || hasEnoughData) {
      const value = this._getDataFromBuffer(start, end)
      const done = value == null ? this._done : false
      return Promise.resolve({ value, done })
    }

    return this._reader.read().then(({ value, done }) => {
      if (done) {
        this._done = true
      } else if (this._buffer === undefined) {
        this._buffer = value
      } else {
        this._buffer = concat(this._buffer, value)
      }

      return this._readUntilEnoughDataOrDone(start, end)
    })
  }

  _getDataFromBuffer(start, end) {
    // Remove data from buffer before `start`.
    // Data might be reread from the buffer if an upload fails, so we can only
    // safely delete data when it comes *before* what is currently being read.
    if (start > this._bufferOffset) {
      this._buffer = this._buffer.slice(start - this._bufferOffset)
      this._bufferOffset = start
    }
    // If the buffer is empty after removing old data, all data has been read.
    const hasAllDataBeenRead = len(this._buffer) === 0
    if (this._done && hasAllDataBeenRead) {
      return null
    }
    // We already removed data before `start`, so we just return the first
    // chunk from the buffer.
    return this._buffer.slice(0, end - start)
  }

  close() {
    if (this._reader.cancel) {
      this._reader.cancel()
    }
  }
}
