"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrowserFileReader = void 0;
const isReactNative_js_1 = require("../reactnative/isReactNative.js");
const uriToBlob_js_1 = require("../reactnative/uriToBlob.js");
const commonFileReader_js_1 = require("../commonFileReader.js");
const BlobFileSource_js_1 = require("../sources/BlobFileSource.js");
class BrowserFileReader {
    async openFile(input, chunkSize) {
        // In React Native, when user selects a file, instead of a File or Blob,
        // you usually get a file object {} with a uri property that contains
        // a local path to the file. We use XMLHttpRequest to fetch
        // the file blob, before uploading with tus.
        if ((0, isReactNative_js_1.isReactNativeFile)(input)) {
            if (!(0, isReactNative_js_1.isReactNativePlatform)()) {
                throw new Error('tus: file objects with `uri` property is only supported in React Native');
            }
            try {
                const blob = await (0, uriToBlob_js_1.uriToBlob)(input.uri);
                return new BlobFileSource_js_1.BlobFileSource(blob);
            }
            catch (err) {
                throw new Error(`tus: cannot fetch \`file.uri\` as Blob, make sure the uri is correct and accessible. ${err}`);
            }
        }
        const fileSource = (0, commonFileReader_js_1.openFile)(input, chunkSize);
        if (fileSource)
            return fileSource;
        throw new Error(`in this environment the source object may only be an instance of: ${commonFileReader_js_1.supportedTypes.join(', ')}`);
    }
}
exports.BrowserFileReader = BrowserFileReader;
//# sourceMappingURL=BrowserFileReader.js.map