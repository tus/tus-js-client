/* eslint no-unused-vars: 0 */
import { readFile, writeFile } from 'fs'
import * as lockfile from 'proper-lockfile'
import * as combineErrors from 'combine-errors'

export const canStoreURLs = true

export class FileUrlStorage {
  constructor (filePath) {
    this.path = filePath
  }

  findAllUploads () {
    return new Promise((resolve, reject) => {
      this._getItems('tus::', (err, results) => {
        if (err) {
          reject(err)
          return
        }
        resolve(results)
      })
    })
  }

  findUploadsByFingerprint (fingerprint) {
    return new Promise((resolve, reject) => {
      this._getItems(`tus::${fingerprint}`, (err, results) => {
        if (err) {
          reject(err)
          return
        }
        resolve(results)
      })
    })
  }

  removeUpload (urlStorageKey) {
    return new Promise((resolve, reject) => {
      this._removeItem(urlStorageKey, (err) => {
        if (err) {
          reject(err)
          return
        }
        resolve()
      })
    })
  }

  addUpload (fingerprint, upload) {
    const id = Math.round(Math.random() * 1e12)
    const key = `tus::${fingerprint}::${id}`

    return new Promise((resolve, reject) => {
      this._setItem(key, upload, (err) => {
        if (err) {
          reject(err)
          return
        }
        resolve(key)
      })
    })
  }

  _setItem (key, value, cb) {
    lockfile.lock(this.path, this._lockfileOptions(), (err, release) => {
      if (err) {
        cb(err)
        return
      }

      const cb2 = this._releaseAndCb(release, cb)

      this._getData((err2, data) => {
        if (err2) {
          cb2(err2)
          return
        }

        this._writeData({ ...data, [key]: value }, (err3) => cb2(err3))
      })
    })
  }

  _getItems (prefix, cb) {
    this._getData((err, data) => {
      if (err) {
        cb(err)
        return
      }

      const results = Object.keys(data)
        .filter((key) => key.startsWith(prefix))
        .map((key) => {
          const obj = data[key]
          obj.urlStorageKey = key
          return obj
        })

      cb(null, results)
    })
  }

  _removeItem (key, cb) {
    lockfile.lock(this.path, this._lockfileOptions(), (err, release) => {
      if (err) {
        cb(err)
        return
      }

      const cb2 = this._releaseAndCb(release, cb)

      this._getData((err2, data) => {
        if (err2) {
          cb2(err2)
          return
        }

        const data2 = { ...data }
        delete data2[key]
        this._writeData(data2, (err3) => cb2(err3))
      })
    })
  }

  _lockfileOptions () {
    return {
      realpath: false,
      retries : {
        retries   : 5,
        minTimeout: 20,
      },
    }
  }

  _releaseAndCb (release, cb) {
    return (err) => {
      if (err) {
        release((releaseErr) => {
          if (releaseErr) cb(combineErrors([err, releaseErr]))
          else cb(err)
        })
        return
      }

      release(cb)
    }
  }

  _writeData (data, cb) {
    const opts = {
      encoding: 'utf8',
      mode    : 0o660,
      flag    : 'w',
    }
    writeFile(this.path, JSON.stringify(data), opts, (err) => cb(err))
  }

  _getData (cb) {
    readFile(this.path, 'utf8', (err, data) => {
      if (err) {
        // return empty data if file does not exist
        if (err.code === 'ENOENT') cb(null, {})
        else cb(err)
      } else {
        try {
          const data2 = !data.trim().length ? {} : JSON.parse(data)
          cb(null, data2)
        } catch (error) {
          cb(error)
        }
      }
    })
  }
}
