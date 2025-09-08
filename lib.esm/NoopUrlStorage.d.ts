import type { PreviousUpload, UrlStorage } from './options.js';
export declare class NoopUrlStorage implements UrlStorage {
    findAllUploads(): Promise<never[]>;
    findUploadsByFingerprint(_fingerprint: string): Promise<never[]>;
    removeUpload(_urlStorageKey: string): Promise<void>;
    addUpload(_urlStorageKey: string, _upload: PreviousUpload): Promise<undefined>;
}
