import { ReadStream } from 'fs'
import isStream from 'is-stream'

import type { FileReader, UploadInput } from '../options.js'
import { BufferFileSource } from './sources/BufferFileSource.js'
import { getFileSource } from './sources/NodeFileSource.js'
import { StreamFileSource } from './sources/StreamFileSource.js'

export class NodeFileReader implements FileReader {
  // TODO: Use async here and less Promise.resolve
  openFile(input: UploadInput, chunkSize: number) {
    if (Buffer.isBuffer(input)) {
      return Promise.resolve(new BufferFileSource(input))
    }

    if (input instanceof ReadStream && input.path != null) {
      return getFileSource(input)
    }

    if (isStream.readable(input)) {
      chunkSize = Number(chunkSize)
      if (!Number.isFinite(chunkSize)) {
        return Promise.reject(
          new Error(
            'cannot create source for stream without a finite value for the `chunkSize` option; specify a chunkSize to control the memory consumption',
          ),
        )
      }
      return Promise.resolve(new StreamFileSource(input))
    }

    return Promise.reject(
      new Error('source object may only be an instance of Buffer or Readable in this environment'),
    )
  }
}
