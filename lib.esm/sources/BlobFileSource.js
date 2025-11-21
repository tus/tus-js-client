import { isCordova } from '../cordova/isCordova.js';
import { readAsByteArray } from '../cordova/readAsByteArray.js';
/**
 * BlobFileSource implements FileSource for Blobs (and therefore also for File instances).
 */
export class BlobFileSource {
    constructor(file) {
        this._file = file;
        this.size = file.size;
    }
    async slice(start, end) {
        // TODO: This looks fishy. We should test how this actually works in Cordova
        // and consider moving this into the lib/cordova/ directory.
        // In Apache Cordova applications, a File must be resolved using
        // FileReader instances, see
        // https://cordova.apache.org/docs/en/8.x/reference/cordova-plugin-file/index.html#read-a-file
        if (isCordova()) {
            const value = await readAsByteArray(this._file.slice(start, end));
            const size = value.length;
            const done = end >= this.size;
            return { value, size, done };
        }
        const value = this._file.slice(start, end);
        const size = value.size;
        const done = end >= this.size;
        return { value, size, done };
    }
    close() {
        // Nothing to do here since we don't need to release any resources.
    }
}
//# sourceMappingURL=BlobFileSource.js.map