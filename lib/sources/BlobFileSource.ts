import { isCordova } from '../cordova/isCordova.js'
import { readAsByteArray } from '../cordova/readAsByteArray.js'
import type { FileSource, SliceResult, UploadOptions } from '../options.js'

/**
 * BlobFileSource implements FileSource for Blobs (and therefore also for File instances).
 */
export class BlobFileSource implements FileSource {
  private readonly _file: Blob

  size: number

  constructor(file: Blob) {
    this._file = file
    this.size = file.size
  }

  fingerprint(options: UploadOptions): Promise<string | null> {
    let name, lastModified;
    if (this._file instanceof File) {
      name = this._file.name;
      lastModified = this._file.lastModified;
    } else {
      name = 'blob';
      lastModified = 0;
    }

    return Promise.resolve(['tus-br', name, this._file.type, this._file.size, lastModified, options.endpoint].join('-'));
  }

  async slice(start: number, end: number): Promise<SliceResult> {
    // TODO: This looks fishy. We should test how this actually works in Cordova
    // and consider moving this into the lib/cordova/ directory.
    // In Apache Cordova applications, a File must be resolved using
    // FileReader instances, see
    // https://cordova.apache.org/docs/en/8.x/reference/cordova-plugin-file/index.html#read-a-file
    if (isCordova()) {
      const value = await readAsByteArray(this._file.slice(start, end))
      const size = value.length
      const done = end >= this.size

      return { value, size, done }
    }

    const value = this._file.slice(start, end)
    const size = value.size
    const done = end >= this.size

    return { value, size, done }
  }

  close() {
    // Nothing to do here since we don't need to release any resources.
  }
}
