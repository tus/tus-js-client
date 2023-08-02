import isCordova from './isCordova.js'
import readAsByteArray from './readAsByteArray.js'

export default class FileSource {
  // Make this.size a method
  constructor(file) {
    this._file = file
    this.size = file.size
  }

  slice(start, end) {
    // In Apache Cordova applications, a File must be resolved using
    // FileReader instances, see
    // https://cordova.apache.org/docs/en/8.x/reference/cordova-plugin-file/index.html#read-a-file
    if (isCordova()) {
      return readAsByteArray(this._file.slice(start, end))
    }

    const value = this._file.slice(start, end)
    const done = end >= this.size
    return Promise.resolve({ value, done })
  }

  close() {
    // Nothing to do here since we don't need to release any resources.
  }
}
