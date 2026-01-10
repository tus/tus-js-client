"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeFileReader = void 0;
const node_fs_1 = require("node:fs");
const is_stream_1 = __importDefault(require("is-stream"));
const commonFileReader_js_1 = require("../commonFileReader.js");
const NodeStreamFileSource_js_1 = require("./sources/NodeStreamFileSource.js");
const PathFileSource_js_1 = require("./sources/PathFileSource.js");
function isPathReference(input) {
    return (typeof input === 'object' &&
        input !== null &&
        'path' in input &&
        (typeof input.path === 'string' || Buffer.isBuffer(input.path)));
}
class NodeFileReader {
    openFile(input, chunkSize) {
        if (isPathReference(input)) {
            return (0, PathFileSource_js_1.getFileSourceFromPath)(input);
        }
        if (is_stream_1.default.readable(input)) {
            chunkSize = Number(chunkSize);
            if (!Number.isFinite(chunkSize)) {
                throw new Error('cannot create source for stream without a finite value for the `chunkSize` option; specify a chunkSize to control the memory consumption');
            }
            return Promise.resolve(new NodeStreamFileSource_js_1.NodeStreamFileSource(input));
        }
        const fileSource = (0, commonFileReader_js_1.openFile)(input, chunkSize);
        if (fileSource)
            return Promise.resolve(fileSource);
        throw new Error(`in this environment the source object may only be an instance of: ${commonFileReader_js_1.supportedTypes.join(', ')}, fs.ReadStream (Node.js), stream.Readable (Node.js)`);
    }
}
exports.NodeFileReader = NodeFileReader;
/**
 * This (unused) function is a simple test to ensure that fs.ReadStreams
 * satisfy the PathReference interface. In the past, tus-js-client explicitly
 * accepted fs.ReadStreams and included it in its type definitions.
 *
 * Since tus-js-client v5, we have moved away from only accepting fs.ReadStream
 * in favor of a more generic PathReference. This function ensures that the definition
 * of PathReference includes fs.ReadStream. If this wasn't the case, the TypeScript
 * compiler would complain during the build step, making this a poor-man's type test.
 */
// biome-ignore lint/correctness/noUnusedVariables: see above
function testFsReadStreamAsPathReference() {
    const pathReference = (0, node_fs_1.createReadStream)('test.txt');
    new NodeFileReader().openFile(pathReference, 1024);
}
//# sourceMappingURL=NodeFileReader.js.map