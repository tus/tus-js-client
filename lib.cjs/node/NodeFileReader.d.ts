import type { FileReader, UploadInput } from '../options.js';
export declare class NodeFileReader implements FileReader {
    openFile(input: UploadInput, chunkSize: number): Promise<import("../options.js").FileSource> | Promise<import("./sources/PathFileSource.js").PathFileSource>;
}
