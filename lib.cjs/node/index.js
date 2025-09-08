"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DetailedError = exports.enableDebugLog = exports.canStoreURLs = exports.isSupported = exports.defaultOptions = exports.Upload = void 0;
const DetailedError_js_1 = require("../DetailedError.js");
Object.defineProperty(exports, "DetailedError", { enumerable: true, get: function () { return DetailedError_js_1.DetailedError; } });
const NoopUrlStorage_js_1 = require("../NoopUrlStorage.js");
const logger_js_1 = require("../logger.js");
Object.defineProperty(exports, "enableDebugLog", { enumerable: true, get: function () { return logger_js_1.enableDebugLog; } });
const upload_js_1 = require("../upload.js");
const FileUrlStorage_js_1 = require("./FileUrlStorage.js");
Object.defineProperty(exports, "canStoreURLs", { enumerable: true, get: function () { return FileUrlStorage_js_1.canStoreURLs; } });
const NodeFileReader_js_1 = require("./NodeFileReader.js");
const NodeHttpStack_js_1 = require("./NodeHttpStack.js");
const fileSignature_js_1 = require("./fileSignature.js");
const defaultOptions = {
    ...upload_js_1.defaultOptions,
    httpStack: new NodeHttpStack_js_1.NodeHttpStack(),
    fileReader: new NodeFileReader_js_1.NodeFileReader(),
    urlStorage: new NoopUrlStorage_js_1.NoopUrlStorage(),
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
// The Node.js environment does not have restrictions which may cause
// tus-js-client not to function.
const isSupported = true;
exports.isSupported = isSupported;
//# sourceMappingURL=index.js.map