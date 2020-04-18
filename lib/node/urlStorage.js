/* eslint no-unused-vars: 0 */
import { readFile, writeFile } from "fs";
import * as lockfile from "proper-lockfile";
import * as combineErrors from "combine-errors";

export const canStoreURLs = true;

export class FileUrlStorage {
  constructor(filePath) {
    this.path = filePath;
  }

  findAllUploads() {
    return new Promise((resolve, reject) => {
      this._getItems("tus::", (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  }

  findUploadsByFingerprint(fingerprint) {
    return new Promise((resolve, reject) => {
      this._getItems(`tus::${fingerprint}`, (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  }

  removeUpload(urlStorageKey) {
    return new Promise((resolve, reject) => {
      this._removeItem(urlStorageKey, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  addUpload(fingerprint, upload) {
    const id = Math.round(Math.random() * 1e12);
    const key = `tus::${fingerprint}::${id}`;

    return new Promise((resolve, reject) => {
      this._setItem(key, upload, (err) => {
        if (err) return reject(err);
        resolve(key);
      });
    });
  }

  _setItem(key, value, cb) {
    lockfile.lock(this.path, this._lockfileOptions(), (err, release) => {
      if (err) {
        return cb(err);
      }

      cb = this._releaseAndCb(release, cb);
      this._getData((err, data) => {
        if (err) {
          return cb(err);
        }

        data[key] = value;
        this._writeData(data, (err) => cb(err));
      });
    });
  }

  _getItems(prefix, cb) {
    this._getData((err, data) => {
      if (err) {
        return cb(err);
      }

      const results = Object.keys(data)
        .filter((key) => key.startsWith(prefix))
        .map((key) => {
          const obj = data[key];
          obj.urlStorageKey = key;
          return obj;
        });

      cb(null, results);
    });
  }

  _removeItem(key, cb) {
    lockfile.lock(this.path, this._lockfileOptions(), (err, release) => {
      if (err) {
        return cb(err);
      }

      cb = this._releaseAndCb(release, cb);
      this._getData((err, data) => {
        if (err) {
          return cb(err);
        }

        delete data[key];
        this._writeData(data, (err) => cb(err));
      });
    });
  }

  _lockfileOptions() {
    return {
      realpath: false,
      retries: {
        retries: 5,
        minTimeout: 20
      }
    };
  }

  _releaseAndCb(release, cb) {
    return (err) => {
      if (err) {
        release((releaseErr) => {
          err = releaseErr ? combineErrors([err, releaseErr]) : err;
          cb(err);
        });
        return;
      }

      release(cb);
    };
  }

  _writeData(data, cb) {
    const opts = {
      encoding: "utf8",
      mode: 0o660,
      flag: "w"
    };
    writeFile(this.path, JSON.stringify(data), opts, (err) => cb(err));
  }

  _getData(cb) {
    readFile(this.path, "utf8", (err, data) => {
      if (err) {
        // return empty data if file does not exist
        err.code === "ENOENT" ? cb(null, {}) : cb(err);
        return;
      } else {
        try {
          data = !data.trim().length ? {} : JSON.parse(data);
        } catch (error) {
          cb(error);
          return;
        }
        cb(null, data);
      }
    });
  }
}
