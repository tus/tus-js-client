import { ReadStream } from 'fs'
import isStream from 'is-stream'

import BufferSource from './sources/BufferSource'
import FileSource from './sources/FileSource'
import StreamSource from './sources/StreamSource'

export default class FileReader {
  openFile (input, chunkSize) {
    if (Buffer.isBuffer(input)) {
      return Promise.resolve(new BufferSource(input))
    }

    if (input instanceof ReadStream && input.path != null) {
      return Promise.resolve(new FileSource(input))
    }

    if (isStream.readable(input)) {
      return Promise.resolve(new StreamSource(input, chunkSize))
    }

    return Promise.reject(new Error('source object may only be an instance of Buffer or Readable in this environment'))
  }
}
