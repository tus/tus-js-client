"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DetailedError = exports.enableDebugLog = exports.canStoreURLs = exports.isSupported = exports.defaultOptions = exports.Upload = void 0;
const DetailedError_js_1 = require("../DetailedError.js");
Object.defineProperty(exports, "DetailedError", { enumerable: true, get: function () { return DetailedError_js_1.DetailedError; } });
const NoopUrlStorage_js_1 = require("../NoopUrlStorage.js");
const logger_js_1 = require("../logger.js");
Object.defineProperty(exports, "enableDebugLog", { enumerable: true, get: function () { return logger_js_1.enableDebugLog; } });
const upload_js_1 = require("../upload.js");
const BrowserFileReader_js_1 = require("./BrowserFileReader.js");
const XHRHttpStack_js_1 = require("./XHRHttpStack.js");
const fileSignature_js_1 = require("./fileSignature.js");
const urlStorage_js_1 = require("./urlStorage.js");
Object.defineProperty(exports, "canStoreURLs", { enumerable: true, get: function () { return urlStorage_js_1.canStoreURLs; } });
const defaultOptions = {
    ...upload_js_1.defaultOptions,
    httpStack: new XHRHttpStack_js_1.XHRHttpStack(),
    fileReader: new BrowserFileReader_js_1.BrowserFileReader(),
    urlStorage: urlStorage_js_1.canStoreURLs ? new urlStorage_js_1.WebStorageUrlStorage() : new NoopUrlStorage_js_1.NoopUrlStorage(),
    fingerprint: fileSignature_js_1.fingerprint,
};
exports.defaultOptions = defaultOptions;
class Upload extends upload_js_1.BaseUpload {
    constructor(file, options = {}) {
        const allOpts = { ...defaultOptions, ...options };
        super(file, allOpts);
    }
    static terminate(url, options = {}) {
        const allOpts = { ...defaultOptions, ...options };
        return (0, upload_js_1.terminate)(url, allOpts);
    }
}
exports.Upload = Upload;
// Note: We don't reference `window` here because these classes also exist in a Web Worker's context.
const isSupported = typeof XMLHttpRequest === 'function' &&
    typeof Blob === 'function' &&
    typeof Blob.prototype.slice === 'function';
exports.isSupported = isSupported;
//# sourceMappingURL=index.js.map