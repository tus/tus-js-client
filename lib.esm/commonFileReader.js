import { ArrayBufferViewFileSource } from './sources/ArrayBufferViewFileSource.js';
import { BlobFileSource } from './sources/BlobFileSource.js';
import { WebStreamFileSource } from './sources/WebStreamFileSource.js';
/**
 * openFile provides FileSources for input types that have to be handled in all environments,
 * including Node.js and browsers.
 */
export function openFile(input, chunkSize) {
    // File is a subtype of Blob, so we only check for Blob here.
    // Note: We could turn Blobs into ArrayBuffers using `input.arrayBuffer()` and then
    // pass it to the ArrayBufferFileSource. However, in browsers, a File instance can
    // represent a file on disk. By keeping it a File instance and passing it to XHR/Fetch,
    // we can avoid reading the entire file into memory.
    if (input instanceof Blob) {
        return new BlobFileSource(input);
    }
    // ArrayBufferViews can be TypedArray (e.g. Uint8Array) or DataView instances.
    // Note that Node.js' Buffers are also Uint8Arrays.
    if (ArrayBuffer.isView(input)) {
        return new ArrayBufferViewFileSource(input);
    }
    // SharedArrayBuffer is not available in all browser context for security reasons.
    // Hence we check if the constructor exists at all.
    if (input instanceof ArrayBuffer ||
        (typeof SharedArrayBuffer !== 'undefined' && input instanceof SharedArrayBuffer)) {
        const view = new DataView(input);
        return new ArrayBufferViewFileSource(view);
    }
    if (input instanceof ReadableStream) {
        chunkSize = Number(chunkSize);
        if (!Number.isFinite(chunkSize)) {
            throw new Error('cannot create source for stream without a finite value for the `chunkSize` option');
        }
        return new WebStreamFileSource(input);
    }
    return null;
}
export const supportedTypes = [
    'File',
    'Blob',
    'ArrayBuffer',
    'SharedArrayBuffer',
    'ArrayBufferView',
    'ReadableStream (Web Streams)',
];
//# sourceMappingURL=commonFileReader.js.map