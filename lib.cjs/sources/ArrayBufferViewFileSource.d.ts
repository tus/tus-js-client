import type { FileSource, SliceResult } from '../options.js';
/**
 * ArrayBufferViewFileSource implements FileSource for ArrayBufferView instances
 * (e.g. TypedArry or DataView).
 *
 * Note that the underlying ArrayBuffer should not change once passed to tus-js-client
 * or it will lead to weird behavior.
 */
export declare class ArrayBufferViewFileSource implements FileSource {
    private _view;
    size: number;
    constructor(view: ArrayBufferView);
    slice(start: number, end: number): Promise<SliceResult>;
    close(): void;
}
