import { createHash } from 'node:crypto'
import { ReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import * as path from 'node:path'
import type { UploadInput, UploadOptions } from '../options.js'
import {
  tusNodeBufferFingerprint,
  tusNodeFileFingerprint,
  tusPlanNodeBufferFingerprint,
  tusUnsupportedInputFingerprint,
} from '../protocol_generated.js'

export async function fingerprint(
  file: UploadInput,
  options: UploadOptions,
): Promise<string | null> {
  if (Buffer.isBuffer(file)) {
    const plan = tusPlanNodeBufferFingerprint({ size: file.length })
    const content = file.slice(0, plan.sampleBytes)
    const hash = createHash(plan.hashAlgorithm).update(content).digest('hex')
    return tusNodeBufferFingerprint({
      contentHash: hash,
      endpoint: options.endpoint,
      size: file.length,
    })
  }

  if (file instanceof ReadStream && file.path != null) {
    const name = path.resolve(Buffer.isBuffer(file.path) ? file.path.toString('utf-8') : file.path)
    const info = await stat(file.path)

    return tusNodeFileFingerprint({
      absolutePath: name,
      endpoint: options.endpoint,
      mtimeMs: info.mtime.getTime(),
      size: info.size,
    })
  }

  return tusUnsupportedInputFingerprint()
}
