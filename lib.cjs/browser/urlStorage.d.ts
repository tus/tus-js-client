import type { PreviousUpload, UrlStorage } from '../options.js';
export declare const canStoreURLs: boolean;
export declare class WebStorageUrlStorage implements UrlStorage {
    findAllUploads(): Promise<PreviousUpload[]>;
    findUploadsByFingerprint(fingerprint: string): Promise<PreviousUpload[]>;
    removeUpload(urlStorageKey: string): Promise<void>;
    addUpload(fingerprint: string, upload: PreviousUpload): Promise<string>;
    private _findEntries;
}
