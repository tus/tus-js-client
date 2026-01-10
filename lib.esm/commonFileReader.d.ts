import type { FileSource, UploadInput } from './options.js';
/**
 * openFile provides FileSources for input types that have to be handled in all environments,
 * including Node.js and browsers.
 */
export declare function openFile(input: UploadInput, chunkSize: number): FileSource | null;
export declare const supportedTypes: string[];
