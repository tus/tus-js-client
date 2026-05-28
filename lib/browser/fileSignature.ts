import type { UploadInput, UploadOptions } from '../options.js'
import {
  tusBrowserBlobFingerprint,
  tusReactNativeFingerprint,
  tusUnsupportedInputFingerprint,
} from '../protocol_generated.js'
import { isReactNativeFile, isReactNativePlatform } from '../reactnative/isReactNative.js'

/**
 * Generate a fingerprint for a file which will be used the store the endpoint
 */
export function fingerprint(file: UploadInput, options: UploadOptions) {
  if (isReactNativePlatform() && isReactNativeFile(file)) {
    return Promise.resolve(
      tusReactNativeFingerprint({
        endpoint: options.endpoint,
        exifJson: file.exif ? JSON.stringify(file.exif) : null,
        name: file.name,
        size: file.size,
      }),
    )
  }

  if (file instanceof Blob) {
    return Promise.resolve(
      tusBrowserBlobFingerprint({
        endpoint: options.endpoint,
        lastModified:
          'lastModified' in file && typeof file.lastModified === 'number'
            ? file.lastModified
            : undefined,
        name: 'name' in file && typeof file.name === 'string' ? file.name : undefined,
        size: file.size,
        type: file.type,
      }),
    )
  }

  return Promise.resolve(tusUnsupportedInputFingerprint())
}
