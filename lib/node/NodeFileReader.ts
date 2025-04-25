import { ReadStream } from 'node:fs'
import isStream from 'is-stream'

import {
  openFile as openBaseFile,
  supportedTypes as supportedBaseTypes,
} from '../commonFileReader.js'
import type { FileReader, UploadInput } from '../options.js'
import { getFileSource } from './sources/NodeFileSource.js'
import { NodeStreamFileSource } from './sources/NodeStreamFileSource.js'

export class NodeFileReader implements FileReader {
  openFile(input: UploadInput, chunkSize: number) {
    if (input instanceof ReadStream && input.path != null) {
      return getFileSource(input)
    }

    if (isStream.readable(input)) {
      chunkSize = Number(chunkSize)
      if (!Number.isFinite(chunkSize)) {
        throw new Error(
          'cannot create source for stream without a finite value for the `chunkSize` option; specify a chunkSize to control the memory consumption',
        )
      }
      return Promise.resolve(new NodeStreamFileSource(input))
    }

    const fileSource = openBaseFile(input, chunkSize)
    if (fileSource) return Promise.resolve(fileSource)

    throw new Error(
      `in this environment the source object may only be an instance of: ${supportedBaseTypes.join(', ')}, fs.ReadStream (Node.js), stream.Readable (Node.js)`,
    )
  }
}
