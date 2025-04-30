import type { Readable } from 'node:stream'
import type { FileSource } from '../../options.js'

/**
 * readChunk reads a chunk with the given size from the given
 * stream. It will wait until enough data is available to satisfy
 * the size requirement before resolving.
 * Only if the stream ends, the function may resolve with a buffer
 * smaller than the size argument.
 * Note that we rely on the stream behaving as Node.js documents:
 * https://nodejs.org/api/stream.html#readablereadsize
 */
async function readChunk(stream: Readable, size: number) {
  return new Promise<Buffer>((resolve, reject) => {
    const onError = (err: Error) => {
      stream.off('readable', onReadable)
      reject(err)
    }

    const onReadable = () => {
      // TODO: Node requires size to be less than 1GB. Add a validation for that
      const chunk = stream.read(size)

      if (chunk != null) {
        stream.off('error', onError)
        stream.off('readable', onReadable)

        resolve(chunk)
      }
    }

    stream.once('error', onError)
    stream.on('readable', onReadable)
  })
}

/**
 * StreamSource provides an interface to obtain slices of a Readable stream for
 * various ranges.
 * It will buffer read data, to allow for following pattern:
 * - Call slice(startA, endA) will buffer the data of the requested range
 * - Call slice(startB, endB) will return data from the buffer if startA <= startB <= endA.
 *   If endB > endA, it will also consume new data from the stream.
 * Note that it is forbidden to call with startB < startA or startB > endA. In other words,
 * the slice calls cannot seek back and must not skip data from the stream.
 */
// TODO: Consider converting the node stream in a web stream. Then we can share the stream
// handling between browsers and node.js.
export class NodeStreamFileSource implements FileSource {
  // Setting the size to null indicates that we have no calculation available
  // for how much data this stream will emit requiring the user to specify
  // it manually (see the `uploadSize` option).
  size = null

  private _stream: Readable

  private _buf = Buffer.alloc(0)

  private _bufPos = 0

  private _ended = false

  private _error: Error | null = null

  constructor(stream: Readable) {
    this._stream = stream

    stream.pause()
    stream.on('end', () => {
      this._ended = true
    })
    stream.on('error', (err) => {
      this._error = err
    })
  }

  async slice(start: number, end: number) {
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

    let returnBuffer: Buffer & { size?: number }
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
      const size = returnBuffer.length
      return { value: returnBuffer, size, done: true }
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

    const size = returnBuffer.length
    return { value: returnBuffer, size, done: this._ended }
  }

  close() {
    this._stream.destroy()
  }
}
