import { isReactNativeFile, isReactNativePlatform } from '../reactnative/isReactNative.js'
import { uriToBlob } from '../reactnative/uriToBlob.js'

import type { FileReader, FileSource, UploadInput } from '../options.js'
import { BlobFileSource } from './sources/BlobFileSource.js'
import { StreamFileSource } from './sources/StreamFileSource.js'

function isWebStream(input: UploadInput): input is Pick<ReadableStreamDefaultReader, 'read'> {
  return 'read' in input && typeof input.read === 'function'
}

// TODO: Make sure that we support ArrayBuffers, TypedArrays, DataViews and Blobs
export class BrowserFileReader implements FileReader {
  async openFile(input: UploadInput, chunkSize: number): Promise<FileSource> {
    // In React Native, when user selects a file, instead of a File or Blob,
    // you usually get a file object {} with a uri property that contains
    // a local path to the file. We use XMLHttpRequest to fetch
    // the file blob, before uploading with tus.
    if (isReactNativeFile(input)) {
      if (!isReactNativePlatform()) {
        throw new Error('tus: file objects with `uri` property is only supported in React Native')
      }

      try {
        const blob = await uriToBlob(input.uri)
        return new BlobFileSource(blob)
      } catch (err) {
        throw new Error(
          `tus: cannot fetch \`file.uri\` as Blob, make sure the uri is correct and accessible. ${err}`,
        )
      }
    }

    // File is a subtype of Blob, so we can check for Blob here.
    if (input instanceof Blob) {
      return Promise.resolve(new BlobFileSource(input))
    }

    if (isWebStream(input)) {
      chunkSize = Number(chunkSize)
      if (!Number.isFinite(chunkSize)) {
        return Promise.reject(
          new Error(
            'cannot create source for stream without a finite value for the `chunkSize` option',
          ),
        )
      }

      return Promise.resolve(new StreamFileSource(input))
    }

    return Promise.reject(
      new Error(
        'source object may only be an instance of File, Blob, or Reader in this environment',
      ),
    )
  }
}
