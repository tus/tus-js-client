async function readChunk (stream) {
  return new Promise((resolve, reject) => {
    const onError = (err) => {
      stream.off("readable", onReadable)
      reject(err)
    }

    const onReadable = () => {
      stream.off("error", onError)
      // TODO: Batch multiple read calls together?
      const chunk = stream.read()
      //console.log(chunk)
      resolve(chunk)
    }

    stream.once('error', onError)
    stream.once("readable", onReadable)

    return

    function tryReadChunk () {
      console.log("tryReadChunk")
      const chunk = stream.read()
      console.log(chunk)

      if (chunk != null) {
        resolve(chunk)
        return
      }

      console.log("ONCE")
      // todo must handle the end case here too
      stream.once('readable', () => tryReadChunk)
    }

    console.log(stream.readable)
    tryReadChunk()
  })
}

export default class StreamSource {
  constructor (stream, chunkSize) {
    console.log("NEW STREAMSOURCE")
    this._stream = stream

    // Setting the size to null indicates that we have no calculation available
    // for how much data this stream will emit requiring the user to specify
    // it manually (see the `uploadSize` option).
    this.size = null

    // TODO: Limit reading to chunkSize? Or is this already done through the Upload class?
    this._chunkSize = +chunkSize

    stream.pause()
    this._ended = false
    stream.on('end', () => {
      console.log("ENDED")
      this._ended = true
    })
    stream.on('error', (err) => {
      this._error = err
    })

    this._buf = Buffer.alloc(0)
    this._bufPos = 0
  }

  // See https://github.com/tus/tus-js-client/issues/275#issuecomment-1047304211
  async slice (start, end) {
    const requestedSize = end - start

    console.log("SLICE", start, end)
    // Fail fast if the caller requests a proportion of the data which is not
    // available any more.
    if (start < this._bufPos) {
      console.log("ERROR", 1)
      throw new Error('cannot slice from position which we already seeked away')
    }

    if (this._error) {
      console.log("ERROR", this._error)
      throw this._error
    }

    const returnBuffers = []
    let returnBuffersLength = 0
    // Always attempt to drain the buffer first, even if this means that we
    // return less data than the caller requested.
    if (start < this._bufPos + this._buf.length) {
      const bufStart = start - this._bufPos
      const bufEnd = Math.min(this._buf.length, end - this._bufPos)

      const sliced = this._buf.slice(bufStart, bufEnd)
      returnBuffers.push(sliced)
      returnBuffersLength += sliced.length

      //sliced.size = sliced.length
      //console.log("RETURN", sliced.length)
      //return { value: sliced }
    }

    while (requestedSize > returnBuffersLength) {
      if (this._ended) {
        console.log("RETURN null")
        return { value: null, done: true }
      }

      console.log("first")
      const newChunk = await readChunk(this._stream)
      //console.log("second")
      returnBuffers.push(newChunk)
      returnBuffersLength += newChunk.length
    }

    const returnBuffer = Buffer.concat(returnBuffers)
    returnBuffer.size = returnBuffer.length

    this._buf = returnBuffer
    this._bufPos = start

    console.log("RETURN", returnBuffer.size)
    return { value: returnBuffer, done: false }


    const bytesToSkip = start - (this._bufPos + this._buf.length)

    let bytesRead = 0
    while (true) {
      

      const receivedChunk = await readChunk(this._stream)

      bytesRead += receivedChunk.length
      if (bytesRead > bytesToSkip) {
        const bytesToSkipInChunk = bytesToSkip - (bytesRead - receivedChunk.length)
        const slicedChunk = receivedChunk.slice(bytesToSkipInChunk)
        this._buf = slicedChunk // store in case the consumer wants to read this chunk (or parts of it) again
        this._bufPos = start
        break
      }
    }

    const requestedLength = end - start

    // need to constrain the returned chunk size?
    const chunkToReturn = this._buf.slice(0, requestedLength)

    chunkToReturn.size = chunkToReturn.length
    console.log("RETURN", chunkToReturn.length)
    return { value: chunkToReturn }
  }

  close () {
    // Note: This destroy is problematic because then we cannot resume as the stream is already closed
    //this._stream.destroy()
  }
}