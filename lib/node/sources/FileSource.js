import { createReadStream, promises as fsPromises } from 'fs'

export default async function getFileSource(stream) {
  const path = stream.path.toString()
  const { size } = await fsPromises.stat(path)

  // The fs.ReadStream might be configured to not read from the beginning
  // to the end, but instead from a slice in between. In this case, we consider
  // that range to indicate the actual uploadable size.
  // This happens, for example, if a fs.ReadStream is used with the `parallelUploads`
  // option. There, the ReadStream is sliced into multiple ReadStreams to fit the number
  // of number of `parallelUploads`. Each ReadStream has `start` and `end` set.
  // Note: `stream.end` is Infinity by default, so we need the check `isFinite`.
  // Note: `stream.end` is treated inclusively, so we need to add 1 here.
  // See the comment in slice() for more context.
  const start = stream.start ?? 0
  const end = Number.isFinite(stream.end) ? stream.end + 1 : size
  const actualSize = end - start

  return new FileSource(stream, path, actualSize)
}

class FileSource {
  constructor(stream, path, size) {
    this._stream = stream
    this._path = path
    this.size = size
  }

  slice(start, end) {
    // The fs.ReadStream might be configured to not read from the beginning,
    // but instead start at a different offset. The start value from the caller
    // does not include the offset, so we need to add this offset to our range later.
    // This happens, for example, if a fs.ReadStream is used with the `parallelUploads`
    // option. First, the ReadStream is sliced into multiple ReadStreams to fit the number
    // of number of `parallelUploads`. Each ReadStream has `start` set.
    const offset = this._stream.start ?? 0

    const stream = createReadStream(this._path, {
      start: offset + start,
      // The `end` option for createReadStream is treated inclusively
      // (see https://nodejs.org/api/fs.html#fs_fs_createreadstream_path_options).
      // However, the Buffer#slice(start, end) and also our Source#slice(start, end)
      // method treat the end range exclusively, so we have to subtract 1.
      // This prevents an off-by-one error when reporting upload progress.
      end: offset + end - 1,
      autoClose: true,
    })
    stream.size = Math.min(end - start, this.size)
    const done = stream.size >= this.size
    return Promise.resolve({ value: stream, done })
  }

  close() {
    this._stream.destroy()
  }
}
