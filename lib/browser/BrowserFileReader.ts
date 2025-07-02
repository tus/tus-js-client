import {
  openFile as openBaseFile,
  supportedTypes as supportedBaseTypes,
} from '../commonFileReader.js'
import type { FileReader, FileSource, UploadInput } from '../options.js'
import { isReactNativeFile, isReactNativePlatform } from '../reactnative/isReactNative.js'
import { uriToBlob } from '../reactnative/uriToBlob.js'
import { BlobFileSource } from '../sources/BlobFileSource.js'

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

    const fileSource = openBaseFile(input, chunkSize)
    if (fileSource) return fileSource

    throw new Error(
      `in this environment the source object may only be an instance of: ${supportedBaseTypes.join(', ')}`,
    )
  }
}
