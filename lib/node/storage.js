/* eslint no-unused-vars: 0 */
import { readFile, writeFile } from "fs";
import * as lockfile from "proper-lockfile";
import * as path from "path";

export const canStoreURLs = true;
const defaultStoragePath = path.join(process.cwd(), 'tus-url-storage.json');

export class FileStorage {
  constructor(filePath) {
    this.path = filePath || defaultStoragePath;
  }

  setItem(key, value, cb) {
    lockfile.lock(this.path, this._lockfileOptions).then((release) => {
      cb = this._releaseAndCb(release, cb);
      this._getData((err, data) => {
        if (err) {
          return cb(err);
        }

        data[key] = value;
        this._writeData(data, (err) => cb(err));
      });
    }).catch(cb)
  }

  getItem(key, cb) {
    this._getData((err, data) => {
      if (err) {
        return cb(err);
      }
      cb(null, data[key]);
    });
  }

  removeItem(key, cb) {
    lockfile.lock(this.path, this._lockfileOptions).then((release) => {
      cb = this._releaseAndCb(release, cb);
      this._getData((err, data) => {
        if (err) {
          return cb(err);
        }

        delete data[key];
        this._writeData(data, (err) => cb(err));
      });
    }).catch(cb);
  }

  get _lockfileOptions() {
    return {
      realpath: false,
      retries: {
        retries: 5,
        minTimeout: 20
      }
    }
  }

  _releaseAndCb(release, cb) {
    return (err) => {
      if (err) {
        // @TODO consider combining both errors in the catch clause
        release().then(() => cb(err)).catch(() => cb(err));
        return;
      }

      release().then(cb).catch(cb);
    }
  }

  _writeData(data, cb) {
    const opts = {
      encoding: 'utf8',
      mode: 0o666,
      flag: 'w'
    }
    writeFile(this.path, JSON.stringify(data), opts, (err) => cb(err));
  }

  _getData(cb) {
    readFile(this.path, 'utf8', (err, data) => {
      if (err) {
        // return empty data if file does not exist
        err.code === 'ENOENT' ? cb(null, {}) : cb(err);
        return;
      } else {
        data = !data.trim().length ? {} : JSON.parse(data);
        cb(null, data);
      }
    })
  }
}

export function getStorage() {
  return new FileStorage();
}