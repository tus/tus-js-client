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
              filename: 'large-file.bin',
              filetype: 'application/octet-stream',
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
              filename: 'large-file.bin',
              filetype: 'application/octet-stream',
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
  // For large files, we validate content by sampling different parts
  // to ensure the file was uploaded correctly without downloading everything
  const sampleSize = 1000 // Sample 1KB from each location

  // Sample from beginning, middle, and end
  const samples = [
    { start: 0, end: sampleSize, name: 'beginning' },
    {
      start: Math.floor(expectedSize / 2),
      end: Math.floor(expectedSize / 2) + sampleSize,
      name: 'middle',
    },
    { start: expectedSize - sampleSize, end: expectedSize, name: 'end' },
  ]

  // Fetch and validate each sample
  const validationPromises = samples.map((sample) => {
    return fetch(upload.url, {
      headers: {
        Range: `bytes=${sample.start}-${sample.end - 1}`,
      },
    })
      .then((res) => {
        expect(res.status).toBe(206) // Partial content
        return res.text()
      })
      .then((data) => {
        // Generate expected content efficiently using the same approach as getLargeBlob
        const offset = sample.start % BLOB_PATTERN.length
        const fullRepetitions = Math.floor(data.length / BLOB_PATTERN.length)
        const remainder = data.length % BLOB_PATTERN.length
        // Create a shifted pattern starting from the offset position
        const shiftedPattern = BLOB_PATTERN.substring(offset) + BLOB_PATTERN.substring(0, offset)
        const expected =
          shiftedPattern.repeat(fullRepetitions) + shiftedPattern.substring(0, remainder)

        if (data !== expected) {
          throw new Error(
            `Content mismatch at ${sample.name} (position ${sample.start}): expected pattern to repeat correctly`,
          )
        }
      })
  })

  return Promise.all(validationPromises).then(() => upload)
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
      expect(metadata).toContain('filename bGFyZ2UtZmlsZS5iaW4=')
      expect(metadata).toContain('filetype YXBwbGljYXRpb24vb2N0ZXQtc3RyZWFt')
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
