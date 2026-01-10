"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlobFileSource = void 0;
const isCordova_js_1 = require("../cordova/isCordova.js");
const readAsByteArray_js_1 = require("../cordova/readAsByteArray.js");
/**
 * BlobFileSource implements FileSource for Blobs (and therefore also for File instances).
 */
class BlobFileSource {
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
        if ((0, isCordova_js_1.isCordova)()) {
            const value = await (0, readAsByteArray_js_1.readAsByteArray)(this._file.slice(start, end));
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
exports.BlobFileSource = BlobFileSource;
//# sourceMappingURL=BlobFileSource.js.map