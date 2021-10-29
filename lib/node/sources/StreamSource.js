import SlicingStream from './SlicingStream'

export default class StreamSource {
  constructor (stream, chunkSize) {
    // Ensure that chunkSize is an integer and not something else or Infinity.
    chunkSize = +chunkSize
    if (!isFinite(chunkSize)) {
      throw new Error('cannot create source for stream without a finite value for the `chunkSize` option')
    }

    this._stream = stream

    // Setting the size to null indicates that we have no calculation available
    // for how much data this stream will emit requiring the user to specify
    // it manually (see the `uploadSize` option).
    this.size = null

    stream.pause()
    this._done = false
    stream.on('end', () => this._done = true)

    this._buf = Buffer.alloc(chunkSize)
    this._bufPos = null
    this._bufLen = 0
  }

  slice (start, end) {
    // Always attempt to drain the buffer first, even if this means that we
    // return less data, then the caller requested.
    if (start >= this._bufPos && start < (this._bufPos + this._bufLen)) {
      const bufStart = start - this._bufPos
      const bufEnd = Math.min(this._bufLen, end - this._bufPos)
      const buf = this._buf.slice(bufStart, bufEnd)
      buf.size = buf.length

      return Promise.resolve({ value: buf })
    }

    // Fail fast if the caller requests a proportion of the data which is not
    // available any more.
    if (start < this._bufPos) {
      return Promise.reject(new Error('cannot slice from position which we already seeked away'))
    }

    if (this._done) {
      return Promise.resolve({ value: null, done: this._done })
    }

    const bytesToSkip = start - (this._bufPos + this._bufLen)
    this._bufLen = 0
    this._bufPos = start
    const bytesToRead = end - start
    const slicingStream = new SlicingStream(bytesToSkip, bytesToRead, this)
    this._stream.pipe(slicingStream)

    return Promise.resolve({ value: slicingStream })
  }

  close () {
    // not implemented
  }
}
