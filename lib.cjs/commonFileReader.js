"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supportedTypes = void 0;
exports.openFile = openFile;
const ArrayBufferViewFileSource_js_1 = require("./sources/ArrayBufferViewFileSource.js");
const BlobFileSource_js_1 = require("./sources/BlobFileSource.js");
const WebStreamFileSource_js_1 = require("./sources/WebStreamFileSource.js");
/**
 * openFile provides FileSources for input types that have to be handled in all environments,
 * including Node.js and browsers.
 */
function openFile(input, chunkSize) {
    // File is a subtype of Blob, so we only check for Blob here.
    // Note: We could turn Blobs into ArrayBuffers using `input.arrayBuffer()` and then
    // pass it to the ArrayBufferFileSource. However, in browsers, a File instance can
    // represent a file on disk. By keeping it a File instance and passing it to XHR/Fetch,
    // we can avoid reading the entire file into memory.
    if (input instanceof Blob) {
        return new BlobFileSource_js_1.BlobFileSource(input);
    }
    // ArrayBufferViews can be TypedArray (e.g. Uint8Array) or DataView instances.
    // Note that Node.js' Buffers are also Uint8Arrays.
    if (ArrayBuffer.isView(input)) {
        return new ArrayBufferViewFileSource_js_1.ArrayBufferViewFileSource(input);
    }
    // SharedArrayBuffer is not available in all browser context for security reasons.
    // Hence we check if the constructor exists at all.
    if (input instanceof ArrayBuffer ||
        (typeof SharedArrayBuffer !== 'undefined' && input instanceof SharedArrayBuffer)) {
        const view = new DataView(input);
        return new ArrayBufferViewFileSource_js_1.ArrayBufferViewFileSource(view);
    }
    if (input instanceof ReadableStream) {
        chunkSize = Number(chunkSize);
        if (!Number.isFinite(chunkSize)) {
            throw new Error('cannot create source for stream without a finite value for the `chunkSize` option');
        }
        return new WebStreamFileSource_js_1.WebStreamFileSource(input);
    }
    return null;
}
exports.supportedTypes = [
    'File',
    'Blob',
    'ArrayBuffer',
    'SharedArrayBuffer',
    'ArrayBufferView',
    'ReadableStream (Web Streams)',
];
//# sourceMappingURL=commonFileReader.js.map