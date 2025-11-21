"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoopUrlStorage = void 0;
class NoopUrlStorage {
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
exports.NoopUrlStorage = NoopUrlStorage;
//# sourceMappingURL=NoopUrlStorage.js.map