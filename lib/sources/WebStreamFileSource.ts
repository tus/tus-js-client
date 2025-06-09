import type {FileSource, SliceResult, UploadOptions} from '../options.js'

function len(blobOrArray: WebStreamFileSource['_buffer']): number {
  if (blobOrArray === undefined) return 0
  if (blobOrArray instanceof Blob) return blobOrArray.size
  return blobOrArray.length
}

/*
  Typed arrays and blobs don't have a concat method.
  This function helps StreamSource accumulate data to reach chunkSize.
*/
function concat<T extends WebStreamFileSource['_buffer']>(a: T, b: T): T {
  if (a instanceof Blob && b instanceof Blob) {
    return new Blob([a, b], { type: a.type }) as T
  }
  if (a instanceof Uint8Array && b instanceof Uint8Array) {
    const c = new Uint8Array(a.length + b.length)
    c.set(a)
    c.set(b, a.length)
    return c as T
  }
  throw new Error('Unknown data type')
}

/**
 * WebStreamFileSource implements FileSource for Web Streams.
 */
// TODO: Can we share code with NodeStreamFileSource?
export class WebStreamFileSource implements FileSource {
  private readonly _reader: ReadableStreamDefaultReader<Uint8Array>

  private _buffer: Blob | Uint8Array | undefined

  // _bufferOffset defines at which position the content of _buffer (if it is set)
  // is located in the view of the entire stream. It does not mean at which offset
  // the content in _buffer begins.
  private _bufferOffset = 0

  private _done = false

  // Setting the size to null indicates that we have no calculation available
  // for how much data this stream will emit requiring the user to specify
  // it manually (see the `uploadSize` option).
  size = null

  constructor(stream: ReadableStream) {
    if (stream.locked) {
      throw new Error(
        'Readable stream is already locked to reader. tus-js-client cannot obtain a new reader.',
      )
    }
    this._reader = stream.getReader()
  }

  fingerprint(options: UploadOptions): Promise<string | null> {
    return Promise.resolve(null);
  }

  async slice(start: number, end: number): Promise<SliceResult> {
    if (start < this._bufferOffset) {
      throw new Error("Requested data is before the reader's current offset")
    }

    return await this._readUntilEnoughDataOrDone(start, end)
  }

  private async _readUntilEnoughDataOrDone(start: number, end: number): Promise<SliceResult> {
    const hasEnoughData = end <= this._bufferOffset + len(this._buffer)
    if (this._done || hasEnoughData) {
      const value = this._getDataFromBuffer(start, end)
      if (value === null) {
        return { value: null, size: null, done: true }
      }

      const size = value instanceof Blob ? value.size : value.length
      const done = this._done
      return { value, size, done }
    }

    const { value, done } = await this._reader.read()
    if (done) {
      this._done = true
    } else {
      const chunkSize = len(value)

      // If all of the chunk occurs before 'start' then drop it and clear the buffer.
      // This greatly improves performance when reading from a stream we haven't started processing yet and 'start' is near the end of the file.
      // Rather than buffering all of the unused data in memory just to only read a chunk near the end, rather immidiately drop data which will never be read.
      if (this._bufferOffset + len(this._buffer) + chunkSize < start) {
        this._buffer = undefined
        this._bufferOffset += chunkSize
      } else if (this._buffer === undefined) {
        this._buffer = value
      } else {
        this._buffer = concat(this._buffer, value)
      }
    }
    return await this._readUntilEnoughDataOrDone(start, end)
  }

  private _getDataFromBuffer(start: number, end: number) {
    if (this._buffer === undefined) {
      throw new Error('cannot _getDataFromBuffer because _buffer is unset')
    }

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
    this._reader.cancel()
  }
}
