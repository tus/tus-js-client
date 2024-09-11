import { ReadStream } from 'fs'
import isStream from 'is-stream'

import BufferSource from './sources/BufferSource.js'
import getFileSource from './sources/FileSource.js'
import StreamSource from './sources/StreamSource.js'

export default class FileReader {
  openFile(input, chunkSize) {
    if (Buffer.isBuffer(input)) {
      return Promise.resolve(new BufferSource(input))
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
      return Promise.resolve(new StreamSource(input))
    }

    return Promise.reject(
      new Error('source object may only be an instance of Buffer or Readable in this environment'),
    )
  }
}
