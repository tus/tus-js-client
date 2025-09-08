import type { Readable } from 'node:stream';
import type { FileSource } from '../../options.js';
/**
 * StreamSource provides an interface to obtain slices of a Readable stream for
 * various ranges.
 * It will buffer read data, to allow for following pattern:
 * - Call slice(startA, endA) will buffer the data of the requested range
 * - Call slice(startB, endB) will return data from the buffer if startA <= startB <= endA.
 *   If endB > endA, it will also consume new data from the stream.
 * Note that it is forbidden to call with startB < startA or startB > endA. In other words,
 * the slice calls cannot seek back and must not skip data from the stream.
 */
export declare class NodeStreamFileSource implements FileSource {
    size: null;
    private _stream;
    private _buf;
    private _bufPos;
    private _ended;
    private _error;
    constructor(stream: Readable);
    slice(start: number, end: number): Promise<{
        value: Buffer<ArrayBufferLike> & {
            size?: number;
        };
        size: number;
        done: boolean;
    }>;
    close(): void;
}
