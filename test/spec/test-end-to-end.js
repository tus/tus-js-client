import { Upload } from 'tus-js-client'
import { getLargeBlob } from './helpers/utils.js'

// Test timeout for end-to-end tests when uploading to real server.
// Increased to handle 50 MB uploads
const END_TO_END_TIMEOUT = 120 * 1000

// File size for end-to-end tests (50 MB = 52,428,800 bytes)
const FILE_SIZE = 50 * 1024 * 1024

// Pattern used for generating large blobs (must match getLargeBlob in utils.js)
const BLOB_PATTERN = 'abcdefghij'

describe('tus', () => {
  describe('end-to-end', () => {
    it(
      'should upload to a real tus server',
      () => {
        return new Promise((resolve, reject) => {
          const file = getLargeBlob(FILE_SIZE)
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
          .then((upload) => validateUploadContent(upload, FILE_SIZE))
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
        return new Promise((resolve, reject) => {
          const file = getLargeBlob(FILE_SIZE)
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
        }).then((upload) => validateUploadContent(upload, FILE_SIZE))
      },
      END_TO_END_TIMEOUT,
    )
  })
})

function validateUploadContent(upload, expectedSize) {
  // Download and validate the entire uploaded file
  return fetch(upload.url)
    .then((res) => {
      expect(res.status).toBe(200)
      return res.text()
    })
    .then((data) => {
      // Verify the file size
      expect(data.length).toBe(expectedSize)

      // Generate the expected content
      const fullRepetitions = Math.floor(expectedSize / BLOB_PATTERN.length)
      const remainder = expectedSize % BLOB_PATTERN.length
      const expected = BLOB_PATTERN.repeat(fullRepetitions) + BLOB_PATTERN.substring(0, remainder)

      // Validate that the content matches
      expect(data).toBe(expected)

      return upload
    })
}

function validateUploadMetadata(upload, expectedSize) {
  return fetch(upload.url, {
    method: 'HEAD',
    headers: {
      'Tus-Resumable': '1.0.0',
    },
  })
    .then((res) => {
      expect(res.status).toBe(200)
      expect(res.headers.get('tus-resumable')).toBe('1.0.0')
      expect(res.headers.get('upload-offset')).toBe(String(expectedSize))
      expect(res.headers.get('upload-length')).toBe(String(expectedSize))

      // The values in the Upload-Metadata header may not be in the same
      // order as we submitted them (the specification does not require
      // that). Therefore, we split the values and verify that each one
      // is present.
      const metadataStr = res.headers.get('upload-metadata')
      expect(metadataStr).toBeTruthy()
      const metadata = metadataStr.split(',')
      expect(metadata).toContain('filename bGFyZ2UtZmlsZS50eHQ=')
      expect(metadata).toContain('filetype dGV4dC9wbGFpbg==')
      expect(metadata).toContain('nonlatin c8WCb8WEY2U=')
      expect(metadata).toContain('number MTAw')
      expect(metadata.length).toBe(4)

      return res.text()
    })
    .then((data) => {
      expect(data).toBe('')

      return upload
    })
}

function validateUploadDeletion(upload) {
  return fetch(upload.url).then((res) => {
    expect(res.status).toBe(404)

    return upload
  })
}
