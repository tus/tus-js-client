import { createReadStream } from 'node:fs';
import isStream from 'is-stream';
import { openFile as openBaseFile, supportedTypes as supportedBaseTypes, } from '../commonFileReader.js';
import { NodeStreamFileSource } from './sources/NodeStreamFileSource.js';
import { getFileSourceFromPath } from './sources/PathFileSource.js';
function isPathReference(input) {
    return (typeof input === 'object' &&
        input !== null &&
        'path' in input &&
        (typeof input.path === 'string' || Buffer.isBuffer(input.path)));
}
export class NodeFileReader {
    openFile(input, chunkSize) {
        if (isPathReference(input)) {
            return getFileSourceFromPath(input);
        }
        if (isStream.readable(input)) {
            chunkSize = Number(chunkSize);
            if (!Number.isFinite(chunkSize)) {
                throw new Error('cannot create source for stream without a finite value for the `chunkSize` option; specify a chunkSize to control the memory consumption');
            }
            return Promise.resolve(new NodeStreamFileSource(input));
        }
        const fileSource = openBaseFile(input, chunkSize);
        if (fileSource)
            return Promise.resolve(fileSource);
        throw new Error(`in this environment the source object may only be an instance of: ${supportedBaseTypes.join(', ')}, fs.ReadStream (Node.js), stream.Readable (Node.js)`);
    }
}
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
    const pathReference = createReadStream('test.txt');
    new NodeFileReader().openFile(pathReference, 1024);
}
//# sourceMappingURL=NodeFileReader.js.map