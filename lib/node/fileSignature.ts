import { createHash } from 'crypto'
import * as fs from 'fs'
import * as path from 'path'
import type { UploadInput, UploadOptions } from '../options.js'

export function fingerprint(file: UploadInput, options: UploadOptions): Promise<string | null> {
  if (Buffer.isBuffer(file)) {
    // create MD5 hash for buffer type
    const blockSize = 64 * 1024 // 64kb
    const content = file.slice(0, Math.min(blockSize, file.length))
    const hash = createHash('md5').update(content).digest('hex')
    const ret = ['node-buffer', hash, file.length, options.endpoint].join('-')
    return Promise.resolve(ret)
  }

  if (file instanceof fs.ReadStream && file.path != null) {
    return new Promise((resolve, reject) => {
      const name = path.resolve(
        Buffer.isBuffer(file.path) ? file.path.toString('utf-8') : file.path,
      )
      fs.stat(file.path, (err, info) => {
        if (err) {
          reject(err)
          return
        }

        const ret = ['node-file', name, info.size, info.mtime.getTime(), options.endpoint].join('-')

        resolve(ret)
      })
    })
  }

  // fingerprint cannot be computed for file input type
  return Promise.resolve(null)
}
