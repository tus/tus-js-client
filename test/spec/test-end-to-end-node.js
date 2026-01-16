import stream from 'node:stream'
import { Upload } from 'tus-js-client'
import {
  getLargeBlob,
  validateUploadContent,
  validateUploadDeletion,
  validateUploadMetadata,
} from './helpers/utils.js'

// Test timeout for end-to-end tests when uploading to real server.
// Increased to handle 50 MiB uploads
const END_TO_END_TIMEOUT = 120 * 1000

// File size for end-to-end tests (50 MiB = 52,428,800 bytes)
const FILE_SIZE = 50 * 1024 * 1024

/**
 * Helper function to create a Node.js Readable stream that emulates streaming data.
 * @param {number} sizeInBytes - Total size of data to stream
 * @param {number} streamChunkSize - Size of each chunk to stream (default 1 MB)
 * @returns {stream.Readable} A Node.js readable stream
 */
function createNodeStreamingSource(sizeInBytes, streamChunkSize = 1024 * 1024) {
  const pattern = 'abcdefghij' // 10 bytes
  let bytesStreamed = 0

  return new stream.Readable({
    read() {
      if (bytesStreamed >= sizeInBytes) {
        this.push(null) // Signal end of stream
        return
      }

      const currentChunkSize = Math.min(streamChunkSize, sizeInBytes - bytesStreamed)

      // Calculate where we are in the pattern for this chunk
      const startOffset = bytesStreamed % pattern.length

      // Build the chunk content efficiently
      const shiftedPattern = pattern.substring(startOffset) + pattern.substring(0, startOffset)
      const fullRepetitions = Math.floor(currentChunkSize / pattern.length)
      const remainder = currentChunkSize % pattern.length
      const chunk = shiftedPattern.repeat(fullRepetitions) + shiftedPattern.substring(0, remainder)

      // Convert to Buffer for Node.js stream
      const data = Buffer.from(chunk, 'utf8')

      this.push(data)
      bytesStreamed += currentChunkSize
    },
  })
}

describe('tus', () => {
  describe('end-to-end Node.js', () => {
    it(
      'should upload a 50 MiB file from Node.js ReadableStream to a real tus server',
      () => {
        // Create a Node.js readable stream
        const nodeStream = createNodeStreamingSource(FILE_SIZE)

        // Store the original blob for validation
        const originalBlob = getLargeBlob(FILE_SIZE)

        return new Promise((resolve, reject) => {
          const options = {
            endpoint: 'https://tusd.tusdemo.net/files/',
            chunkSize: 20 * 1024 * 1024, // 20 MiB chunks
            uploadSize: FILE_SIZE, // Must specify size for Node.js streams
            metadata: {
              nonlatin: 'słońce',
              number: 100,
              filename: 'large-file.txt',
              filetype: 'text/plain',
            },
            onSuccess() {
              expect(upload.url).toMatch(/^https:\/\/tusd\.tusdemo\.net\/files\//)
              console.log('Upload URL (Node.js stream):', upload.url)

              resolve(upload)
            },
            onError(err) {
              reject(err)
            },
          }

          const upload = new Upload(nodeStream, options)
          upload.start()
        })
          .then((upload) => validateUploadContent(upload, originalBlob))
          .then((upload) => validateUploadMetadata(upload, FILE_SIZE))
          .then((upload) => {
            return upload.abort(true).then(() => upload)
          })
          .then(validateUploadDeletion)
      },
      END_TO_END_TIMEOUT,
    )
  })
})
