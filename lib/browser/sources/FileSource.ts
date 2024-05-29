import type { FileSource, SliceResult } from '../../options.js'
import type { FileSliceTypes } from '../index.js'
import isCordova from './isCordova.js'
import readAsByteArray from './readAsByteArray.js'

// TODO: Rename file
export default class BlobFileSource implements FileSource<FileSliceTypes> {
  _file: Blob

  size: number

  constructor(file: Blob) {
    this._file = file
    this.size = file.size
  }

  async slice(start: number, end: number): Promise<SliceResult<FileSliceTypes>> {
    let value: FileSliceTypes
    // In Apache Cordova applications, a File must be resolved using
    // FileReader instances, see
    // https://cordova.apache.org/docs/en/8.x/reference/cordova-plugin-file/index.html#read-a-file
    if (isCordova()) {
      value = await readAsByteArray(this._file.slice(start, end))
    } else {
      value = this._file.slice(start, end)
    }

    const done = end >= this.size
    return Promise.resolve({ value, done })
  }

  close() {
    // Nothing to do here since we don't need to release any resources.
  }
}
