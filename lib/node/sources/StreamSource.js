async function readChunk (stream, size) {
  return new Promise((resolve, reject) => {
    const onError = (err) => {
      stream.off('readable', onReadable)
      reject(err)
    }

    const onReadable = () => {
      // TODO: Node requires size to be less than 1GB. Add a validation for that
      const chunk = stream.read(size)

      if (chunk !== null) {
        stream.off('error', onError)
        stream.off('readable', onReadable)

        resolve(chunk)
      }
    }

    stream.once('error', onError)
    stream.on('readable', onReadable)
  })
}

export default class StreamSource {
  constructor (stream) {
    this._stream = stream

    // Setting the size to null indicates that we have no calculation available
    // for how much data this stream will emit requiring the user to specify
    // it manually (see the `uploadSize` option).
    this.size = null

    this._buf = Buffer.alloc(0)
    this._bufPos = 0

    this._ended = false
    this._error = null

    stream.pause()
    stream.on('end', () => {
      this._ended = true
    })
    stream.on('error', (err) => {
      this._error = err
    })
  }

  async slice (start, end) {
    // Fail fast if the caller requests a proportion of the data which is not
    // available any more.
    if (start < this._bufPos) {
      throw new Error('cannot slice from position which we already seeked away')
    }

    if (start > this._bufPos + this._buf.length) {
      throw new Error('slice start is outside of buffer (currently not implemented)')
    }

    if (this._error) {
      throw this._error
    }

    let returnBuffer
    // Always attempt to drain the buffer first, even if this means that we
    // return less data than the caller requested.
    if (start < this._bufPos + this._buf.length) {
      const bufStart = start - this._bufPos
      const bufEnd = Math.min(this._buf.length, end - this._bufPos)

      returnBuffer = this._buf.slice(bufStart, bufEnd)
    } else {
      returnBuffer = Buffer.alloc(0)
    }

    // If the stream has ended already, read calls would not finish, so return early here.
    if (this._ended) {
      returnBuffer.size = returnBuffer.length
      return { value: returnBuffer, done: true }
    }

    // If we could not satisfy the slice request from the buffer only, read more data from
    // the stream and add it to the buffer.
    const requestedSize = end - start
    if (requestedSize > returnBuffer.length) {
      // Note: We assume that the stream returns not more than the requested size.
      const newChunk = await readChunk(this._stream, requestedSize - returnBuffer.length)

      // Append the new chunk to the buffer
      returnBuffer = Buffer.concat([returnBuffer, newChunk])
    }

    // Important: Store the read data, so consecutive slice calls can access the same data.
    this._buf = returnBuffer
    this._bufPos = start

    returnBuffer.size = returnBuffer.length
    return { value: returnBuffer, done: this._ended }
  }

  close () {
    // Note: We do not destroy the stream here. The user passed the stream to tus-js-client and it
    // is therefore their responsibility to close it.
  }
}
