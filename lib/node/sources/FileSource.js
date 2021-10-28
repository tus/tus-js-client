import { createReadStream } from 'fs'

export default class FileSource {
  constructor (stream) {
    this._stream = stream
    this._path = stream.path.toString()
  }

  slice (start, end) {
    const stream = createReadStream(this._path, {
      start,
      // The `end` option for createReadStream is treated inclusively
      // (see https://nodejs.org/api/fs.html#fs_fs_createreadstream_path_options).
      // However, the Buffer#slice(start, end) and also our Source#slice(start, end)
      // method treat the end range exclusively, so we have to subtract 1.
      // This prevents an off-by-one error when reporting upload progress.
      end      : end - 1,
      autoClose: true,
    })
    stream.size = end - start
    return Promise.resolve({ value: stream })
  }

  close () {
    this._stream.destroy()
  }
}
