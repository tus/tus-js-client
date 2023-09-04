import isReactNative from './isReactNative.js'
import uriToBlob from './uriToBlob.js'

import FileSource from './sources/FileSource.js'
import StreamSource from './sources/StreamSource.js'

export default class FileReader {
  async openFile(input, chunkSize) {
    // In React Native, when user selects a file, instead of a File or Blob,
    // you usually get a file object {} with a uri property that contains
    // a local path to the file. We use XMLHttpRequest to fetch
    // the file blob, before uploading with tus.
    if (isReactNative() && input && typeof input.uri !== 'undefined') {
      try {
        const blob = await uriToBlob(input.uri)
        return new FileSource(blob)
      } catch (err) {
        throw new Error(
          `tus: cannot fetch \`file.uri\` as Blob, make sure the uri is correct and accessible. ${err}`,
        )
      }
    }

    // Since we emulate the Blob type in our tests (not all target browsers
    // support it), we cannot use `instanceof` for testing whether the input value
    // can be handled. Instead, we simply check is the slice() function and the
    // size property are available.
    if (typeof input.slice === 'function' && typeof input.size !== 'undefined') {
      return Promise.resolve(new FileSource(input))
    }

    if (typeof input.read === 'function') {
      chunkSize = Number(chunkSize)
      if (!Number.isFinite(chunkSize)) {
        return Promise.reject(
          new Error(
            'cannot create source for stream without a finite value for the `chunkSize` option',
          ),
        )
      }

      return Promise.resolve(new StreamSource(input, chunkSize))
    }

    return Promise.reject(
      new Error(
        'source object may only be an instance of File, Blob, or Reader in this environment',
      ),
    )
  }
}
