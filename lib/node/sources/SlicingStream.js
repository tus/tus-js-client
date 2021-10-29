import { Transform } from 'stream'

export default class SlicingStream extends Transform {
  constructor (bytesToSkip, bytesToRead, source) {
    super()

    // The number of bytes we have to discard before we start emitting data.
    this._bytesToSkip = bytesToSkip
    // The number of bytes we will emit in the data events before ending this stream.
    this._bytesToRead = bytesToRead
    // Points to the StreamSource object which created this SlicingStream.
    // This reference is used for manipulating the _bufLen and _buf properties
    // directly.
    this._source = source
  }

  _transform (chunk, encoding, callback) {
    // Calculate the number of bytes we still have to skip before we can emit data.
    const bytesSkipped = Math.min(this._bytesToSkip, chunk.length)
    this._bytesToSkip -= bytesSkipped

    // Calculate the number of bytes we can emit after we skipped enough data.
    const bytesAvailable = chunk.length - bytesSkipped

    // If no bytes are available, because the entire chunk was skipped, we can
    // return earily.
    if (bytesAvailable === 0) {
      callback(null)
      return
    }

    const bytesToRead = Math.min(this._bytesToRead, bytesAvailable)
    this._bytesToRead -= bytesToRead

    if (bytesToRead !== 0) {
      const data = chunk.slice(bytesSkipped, bytesSkipped + bytesToRead)
      this._source._bufLen += data.copy(this._source._buf, this._source._bufLen)
      this.push(data)
    }

    // If we do not have to read any more bytes for this transform stream, we
    // end it and also unpipe our source, to avoid calls to _transform in the
    // future
    if (this._bytesToRead === 0) {
      this._source._stream.unpipe(this)
      this.end()
    }

    // If we did not use all the available data, we return it to the source
    // so the next SlicingStream can handle it.
    if (bytesToRead !== bytesAvailable) {
      const unusedChunk = chunk.slice(bytesSkipped + bytesToRead)
      this._source._stream.unshift(unusedChunk)
    }

    callback(null)
  }
}
