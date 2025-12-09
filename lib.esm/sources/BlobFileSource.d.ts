import type { FileSource, SliceResult } from '../options.js';
/**
 * BlobFileSource implements FileSource for Blobs (and therefore also for File instances).
 */
export declare class BlobFileSource implements FileSource {
    private _file;
    size: number;
    constructor(file: Blob);
    slice(start: number, end: number): Promise<SliceResult>;
    close(): void;
}
