import { type ReadStream } from 'node:fs';
import type { FileSource, PathReference } from '../../options.js';
export declare function getFileSourceFromPath(file: PathReference): Promise<PathFileSource>;
export declare class PathFileSource implements FileSource {
    size: number;
    private _file;
    private _path;
    constructor(file: PathReference, path: string, size: number);
    slice(start: number, end: number): Promise<{
        value: ReadStream & {
            size?: number;
        };
        size: number;
        done: boolean;
    }>;
    close(): void;
}
