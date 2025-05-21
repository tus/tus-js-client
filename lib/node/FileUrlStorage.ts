import { readFile, writeFile } from 'node:fs/promises'
import { lock } from 'proper-lockfile'
import type { PreviousUpload, UrlStorage } from '../options.js'

export const canStoreURLs = true

export class FileUrlStorage implements UrlStorage {
  path: string

  constructor(filePath: string) {
    this.path = filePath
  }

  async findAllUploads(): Promise<PreviousUpload[]> {
    return await this._getItems('tus::')
  }

  async findUploadsByFingerprint(fingerprint: string): Promise<PreviousUpload[]> {
    return await this._getItems(`tus::${fingerprint}`)
  }

  async removeUpload(urlStorageKey: string): Promise<void> {
    await this._removeItem(urlStorageKey)
  }

  async addUpload(fingerprint: string, upload: PreviousUpload): Promise<string> {
    const id = Math.round(Math.random() * 1e12)
    const key = `tus::${fingerprint}::${id}`

    await this._setItem(key, upload)
    return key
  }

  private async _setItem(key: string, value: unknown) {
    const release = await lock(this.path, this._lockfileOptions())

    try {
      const data = await this._getData()
      data[key] = value
      await this._writeData(data)
    } finally {
      await release()
    }
  }

  private async _getItems(prefix: string) {
    const data = await this._getData()

    const results = Object.keys(data)
      .filter((key) => key.startsWith(prefix))
      .map((key) => {
        const obj = data[key]
        obj.urlStorageKey = key
        return obj
      })

    return results
  }

  private async _removeItem(key: string) {
    const release = await lock(this.path, this._lockfileOptions())

    try {
      const data = await this._getData()
      delete data[key]
      await this._writeData(data)
    } finally {
      await release()
    }
  }

  private _lockfileOptions() {
    return {
      realpath: false,
      retries: {
        retries: 5,
        minTimeout: 20,
      },
    }
  }

  private async _writeData(data: unknown): Promise<void> {
    await writeFile(this.path, JSON.stringify(data), {
      encoding: 'utf8',
      mode: 0o660,
      flag: 'w',
    })
  }

  private async _getData() {
    let data = ''
    try {
      data = await readFile(this.path, 'utf8')
    } catch (err) {
      // return empty data if file does not exist
      if (err != null && typeof err === 'object' && 'code' in err && err.code === 'ENOENT')
        return {}
    }

    data = data.trim()

    return data.length === 0 ? {} : JSON.parse(data)
  }
}
