/* eslint no-unused-vars: 0 */
import { readFile, writeFile } from "fs";
import * as lockfile from "proper-lockfile";
import * as combineErrors from "combine-errors";

export const canStoreURLs = true;

export function getStorage() {
  // don't support storage by default.
  return null;
}


export class FileStorage {
  constructor(filePath) {
    this.path = filePath;
  }

  setItem(key, value, cb) {
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

  getItem(key, cb) {
    this._getData((err, data) => {
      if (err) {
        return cb(err);
      }
      cb(null, data[key]);
    });
  }

  removeItem(key, cb) {
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
