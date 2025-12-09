import type { PreviousUpload, UrlStorage } from '../options.js';
export declare const canStoreURLs = true;
export declare class FileUrlStorage implements UrlStorage {
    path: string;
    constructor(filePath: string);
    findAllUploads(): Promise<PreviousUpload[]>;
    findUploadsByFingerprint(fingerprint: string): Promise<PreviousUpload[]>;
    removeUpload(urlStorageKey: string): Promise<void>;
    addUpload(fingerprint: string, upload: PreviousUpload): Promise<string>;
    private _setItem;
    private _getItems;
    private _removeItem;
    private _lockfileOptions;
    private _writeData;
    private _getData;
}
