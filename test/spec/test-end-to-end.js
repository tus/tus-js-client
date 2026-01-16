import { Upload } from 'tus-js-client'
import {
  createStreamingSource,
  getLargeBlob,
  validateUploadContent,
  validateUploadDeletion,
  validateUploadMetadata,
} from './helpers/utils.js'

// Test timeout for end-to-end tests when uploading to real server.
// Increased to handle 50 MB uploads
const END_TO_END_TIMEOUT = 120 * 1000

// File size for end-to-end tests (50 MB = 52,428,800 bytes)
const FILE_SIZE = 50 * 1024 * 1024

describe('tus', () => {
  describe('end-to-end', () => {
    it(
      'should upload to a real tus server',
      () => {
        const file = getLargeBlob(FILE_SIZE)
        return new Promise((resolve, reject) => {
          const options = {
            endpoint: 'https://tusd.tusdemo.net/files/',
            metadata: {
              nonlatin: 'słońce',
              number: 100,
              filename: 'large-file.txt',
              filetype: 'text/plain',
            },
            onSuccess() {
              expect(upload.url).toMatch(/^https:\/\/tusd\.tusdemo\.net\/files\//)
              console.log('Upload URL:', upload.url)

              resolve(upload)
            },
            onError(err) {
              reject(err)
            },
          }

          const upload = new Upload(file, options)
          upload.start()
        })
          .then((upload) => validateUploadContent(upload, file))
          .then((upload) => validateUploadMetadata(upload, FILE_SIZE))
          .then((upload) => {
            return upload.abort(true).then(() => upload)
          })
          .then(validateUploadDeletion)
      },
      END_TO_END_TIMEOUT,
    )

    it(
      'should upload to a real tus server with creation-with-upload',
      () => {
        const file = getLargeBlob(FILE_SIZE)
        return new Promise((resolve, reject) => {
          const options = {
            endpoint: 'https://tusd.tusdemo.net/files/',
            metadata: {
              nonlatin: 'słońce',
              number: 100,
              filename: 'large-file.txt',
              filetype: 'text/plain',
            },
            onSuccess() {
              expect(upload.url).toMatch(/^https:\/\/tusd\.tusdemo\.net\/files\//)
              console.log('Upload URL:', upload.url)

              resolve(upload)
            },
            onError(err) {
              reject(err)
            },
          }

          const upload = new Upload(file, options)
          upload.start()
        }).then((upload) => validateUploadContent(upload, file))
      },
      END_TO_END_TIMEOUT,
    )

    it(
      'should upload a streamed 50 MB file to a real tus server',
      () => {
        // Create a streaming source that yields data piece by piece
        const stream = createStreamingSource(FILE_SIZE)

        // Store the original blob for validation
        const originalBlob = getLargeBlob(FILE_SIZE)

        return new Promise((resolve, reject) => {
          const options = {
            endpoint: 'https://tusd.tusdemo.net/files/',
            chunkSize: 20 * 1024 * 1024, // 20 MiB chunks
            metadata: {
              nonlatin: 'słońce',
              number: 100,
              filename: 'large-file.txt',
              filetype: 'text/plain',
            },
            uploadLengthDeferred: true, // Required for streaming sources
            onSuccess() {
              expect(upload.url).toMatch(/^https:\/\/tusd\.tusdemo\.net\/files\//)
              console.log('Upload URL (streamed):', upload.url)

              resolve(upload)
            },
            onError(err) {
              reject(err)
            },
          }

          const upload = new Upload(stream, options)
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
