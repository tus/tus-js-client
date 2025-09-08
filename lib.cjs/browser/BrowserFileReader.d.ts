import type { FileReader, FileSource, UploadInput } from '../options.js';
export declare class BrowserFileReader implements FileReader {
    openFile(input: UploadInput, chunkSize: number): Promise<FileSource>;
}
