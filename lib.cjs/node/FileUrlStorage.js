"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileUrlStorage = exports.canStoreURLs = void 0;
const promises_1 = require("node:fs/promises");
const proper_lockfile_1 = require("proper-lockfile");
exports.canStoreURLs = true;
class FileUrlStorage {
    constructor(filePath) {
        this.path = filePath;
    }
    async findAllUploads() {
        return await this._getItems('tus::');
    }
    async findUploadsByFingerprint(fingerprint) {
        return await this._getItems(`tus::${fingerprint}`);
    }
    async removeUpload(urlStorageKey) {
        await this._removeItem(urlStorageKey);
    }
    async addUpload(fingerprint, upload) {
        const id = Math.round(Math.random() * 1e12);
        const key = `tus::${fingerprint}::${id}`;
        await this._setItem(key, upload);
        return key;
    }
    async _setItem(key, value) {
        const release = await (0, proper_lockfile_1.lock)(this.path, this._lockfileOptions());
        try {
            const data = await this._getData();
            data[key] = value;
            await this._writeData(data);
        }
        finally {
            await release();
        }
    }
    async _getItems(prefix) {
        const data = await this._getData();
        const results = Object.keys(data)
            .filter((key) => key.startsWith(prefix))
            .map((key) => {
            const obj = data[key];
            obj.urlStorageKey = key;
            return obj;
        });
        return results;
    }
    async _removeItem(key) {
        const release = await (0, proper_lockfile_1.lock)(this.path, this._lockfileOptions());
        try {
            const data = await this._getData();
            delete data[key];
            await this._writeData(data);
        }
        finally {
            await release();
        }
    }
    _lockfileOptions() {
        return {
            realpath: false,
            retries: {
                retries: 5,
                minTimeout: 20,
            },
        };
    }
    async _writeData(data) {
        await (0, promises_1.writeFile)(this.path, JSON.stringify(data), {
            encoding: 'utf8',
            mode: 0o660,
            flag: 'w',
        });
    }
    async _getData() {
        let data = '';
        try {
            data = await (0, promises_1.readFile)(this.path, 'utf8');
        }
        catch (err) {
            // return empty data if file does not exist
            if (err != null && typeof err === 'object' && 'code' in err && err.code === 'ENOENT')
                return {};
        }
        data = data.trim();
        return data.length === 0 ? {} : JSON.parse(data);
    }
}
exports.FileUrlStorage = FileUrlStorage;
//# sourceMappingURL=FileUrlStorage.js.map