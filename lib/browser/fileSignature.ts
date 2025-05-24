import type { ReactNativeFile, UploadInput, UploadOptions } from '../options.js'

/**
 * Generate a fingerprint for a file which will be used the store the endpoint
 */
export function fingerprint(file: UploadInput, options: UploadOptions) {

  if (file instanceof Blob) {
    return Promise.resolve(
      //@ts-expect-error TODO: We have to check the input type here
      // This can be fixed by moving the fingerprint function to the FileReader class
      ['tus-br', file.name, file.type, file.size, file.lastModified, options.endpoint].join('-'),
    )
  }

  return Promise.resolve(null)
}
