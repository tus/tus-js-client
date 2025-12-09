import type { FileSource, SliceResult } from '../options.js';
/**
 * WebStreamFileSource implements FileSource for Web Streams.
 */
export declare class WebStreamFileSource implements FileSource {
    private _reader;
    private _buffer;
    private _bufferOffset;
    private _done;
    size: null;
    constructor(stream: ReadableStream);
    slice(start: number, end: number): Promise<SliceResult>;
    private _readUntilEnoughDataOrDone;
    private _getDataFromBuffer;
    close(): void;
}
