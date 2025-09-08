import { DetailedError } from '../DetailedError.js';
import { NoopUrlStorage } from '../NoopUrlStorage.js';
import { enableDebugLog } from '../logger.js';
import { BaseUpload, defaultOptions as baseDefaultOptions, terminate } from '../upload.js';
import { canStoreURLs } from './FileUrlStorage.js';
import { NodeFileReader } from './NodeFileReader.js';
import { NodeHttpStack as DefaultHttpStack } from './NodeHttpStack.js';
import { fingerprint } from './fileSignature.js';
const defaultOptions = {
    ...baseDefaultOptions,
    httpStack: new DefaultHttpStack(),
    fileReader: new NodeFileReader(),
    urlStorage: new NoopUrlStorage(),
    fingerprint,
};
class Upload extends BaseUpload {
    constructor(file, options = {}) {
        const allOpts = { ...defaultOptions, ...options };
        super(file, allOpts);
    }
    static terminate(url, options = {}) {
        const allOpts = { ...defaultOptions, ...options };
        return terminate(url, allOpts);
    }
}
// The Node.js environment does not have restrictions which may cause
// tus-js-client not to function.
const isSupported = true;
// Note: The exported interface must be the same as in lib/browser/index.ts.
// Any changes should be reflected in both files.
export { Upload, defaultOptions, isSupported, canStoreURLs, enableDebugLog, DetailedError };
//# sourceMappingURL=index.js.map