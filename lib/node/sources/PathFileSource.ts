import { type ReadStream, createReadStream, promises as fsPromises } from 'node:fs'
import type { FileSource, PathReference } from '../../options.js'

export async function getFileSourceFromPath(file: PathReference): Promise<PathFileSource> {
  const path = file.path.toString()
  const { size } = await fsPromises.stat(path)

  // The path reference might be configured to not read from the beginning
  // to the end, but instead from a slice in between. In this case, we consider
  // that range to indicate the actual uploadable size.
  // This happens, for example, if a path reference is used with the `parallelUploads`
  // option. There, the path reference is sliced into multiple fs.ReadStreams to fit the
  // number of `parallelUploads`. Each ReadStream has `start` and `end` set.
  // Note: `stream.end` is Infinity by default, so we need the check `isFinite`.
  // Note: `stream.end` is treated inclusively, so we need to add 1 here.
  // See the comment in slice() for more context.
  const start = file.start ?? 0
  const end = file.end != null && Number.isFinite(file.end) ? file.end + 1 : size
  const actualSize = end - start

  return new PathFileSource(file, path, actualSize)
}

export class PathFileSource implements FileSource {
  size: number

  private _file: PathReference

  private _path: string

  constructor(file: PathReference, path: string, size: number) {
    this._file = file
    this._path = path
    this.size = size
  }

  slice(start: number, end: number) {
    // TODO: Does this create multiple file descriptors? Can we reduce this by
    // using a file handle instead?
    // The path reference might be configured to not read from the beginning,
    // but instead start at a different offset. The start value from the caller
    // does not include the offset, so we need to add this offset to our range later.
    // This happens, for example, if a path reference is used with the `parallelUploads`
    // option. First, the path reference is sliced into multiple fs.ReadStreams to fit the
    // number of `parallelUploads`. Each ReadStream has `start` set.
    const offset = this._file.start ?? 0

    const stream: ReadStream & { size?: number } = createReadStream(this._path, {
      start: offset + start,
      // The `end` option for createReadStream is treated inclusively
      // (see https://nodejs.org/api/fs.html#fs_fs_createreadstream_path_options).
      // However, the Buffer#slice(start, end) and also our Source#slice(start, end)
      // method treat the end range exclusively, so we have to subtract 1.
      // This prevents an off-by-one error when reporting upload progress.
      end: offset + end - 1,
      autoClose: true,
    })
    const size = Math.min(end - start, this.size)
    const done = size >= this.size
    return Promise.resolve({ value: stream, size, done })
  }

  close() {
    // TODO: Ensure that the read streams are closed
    // TODO: Previously, the passed fs.ReadStream was closed here. Should we keep this behavior? If not, this is a breaking change.
  }
}
