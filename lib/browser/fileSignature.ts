import type { ReactNativeFile, UploadInput, UploadOptions } from '../options.js'
import { isReactNativeFile, isReactNativePlatform } from '../reactnative/isReactNative.js'

/**
 * Generate a fingerprint for a file which will be used the store the endpoint
 */
export function fingerprint(file: UploadInput, options: UploadOptions) {
  if (isReactNativePlatform() && isReactNativeFile(file)) {
    return Promise.resolve(reactNativeFingerprint(file, options))
  }

  if (file instanceof Blob) {
    return Promise.resolve(
      //@ts-expect-error TODO: We have to check the input type here
      // This can be fixed by moving the fingerprint function to the FileReader class
      ['tus-br', file.name, file.type, file.size, file.lastModified, options.endpoint].join('-'),
    )
  }

  return Promise.resolve(null)
}

function reactNativeFingerprint(file: ReactNativeFile, options: UploadOptions): string {
  const exifHash = file.exif ? hashCode(JSON.stringify(file.exif)) : 'noexif'
  return ['tus-rn', file.name || 'noname', file.size || 'nosize', exifHash, options.endpoint].join(
    '/',
  )
}

function hashCode(str: string): number {
  // from https://stackoverflow.com/a/8831937/151666
  let hash = 0
  if (str.length === 0) {
    return hash
  }
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash &= hash // Convert to 32bit integer
  }
  return hash
}
