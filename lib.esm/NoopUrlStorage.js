export class NoopUrlStorage {
    findAllUploads() {
        return Promise.resolve([]);
    }
    findUploadsByFingerprint(_fingerprint) {
        return Promise.resolve([]);
    }
    removeUpload(_urlStorageKey) {
        return Promise.resolve();
    }
    addUpload(_urlStorageKey, _upload) {
        return Promise.resolve(undefined);
    }
}
//# sourceMappingURL=NoopUrlStorage.js.map