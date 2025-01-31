import { createHash } from 'node:crypto'
import { ReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import * as path from 'node:path'
import type { UploadInput, UploadOptions } from '../options.js'

export async function fingerprint(
  file: UploadInput,
  options: UploadOptions,
): Promise<string | null> {
  if (Buffer.isBuffer(file)) {
    // create MD5 hash for buffer type
    const blockSize = 64 * 1024 // 64kb
    const content = file.slice(0, Math.min(blockSize, file.length))
    const hash = createHash('md5').update(content).digest('hex')
    const ret = ['node-buffer', hash, file.length, options.endpoint].join('-')
    return ret
  }

  if (file instanceof ReadStream && file.path != null) {
    const name = path.resolve(Buffer.isBuffer(file.path) ? file.path.toString('utf-8') : file.path)
    const info = await stat(file.path)
    const ret = ['node-file', name, info.size, info.mtime.getTime(), options.endpoint].join('-')

    return ret
  }

  // fingerprint cannot be computed for file input type
  return null
}
