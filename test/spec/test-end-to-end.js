import { Upload } from 'tus-js-client'
import { getBlob } from './helpers/utils.js'

// Test timeout for end-to-end tests when uploading to real server.
const END_TO_END_TIMEOUT = 20 * 1000

describe('tus', () => {
  describe('end-to-end', () => {
    it(
      'should upload to a real tus server',
      async () => {
        return new Promise((resolve, reject) => {
          const file = getBlob('hello world')
          const options = {
            endpoint: 'https://tusd.tusdemo.net/files/',
            metadata: {
              nonlatin: 'słońce',
              number: 100,
              filename: 'hello.txt',
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
          .then(validateUploadContent)
          .then((upload) => {
            return upload.abort(true).then(() => upload)
          })
          .then(validateUploadDeletion)
      },
      END_TO_END_TIMEOUT,
    )

    it(
      'should upload to a real tus server with creation-with-upload',
      async () => {
        return new Promise((resolve, reject) => {
          const file = getBlob('hello world')
          const options = {
            endpoint: 'https://tusd.tusdemo.net/files/',
            metadata: {
              nonlatin: 'słońce',
              number: 100,
              filename: 'hello.txt',
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
        }).then(validateUploadContent)
      },
      END_TO_END_TIMEOUT,
    )
  })
})

function validateUploadContent(upload) {
  return fetch(upload.url)
    .then((res) => {
      expect(res.status).toBe(200)
      return res.text()
    })
    .then((data) => {
      expect(data).toBe('hello world')

      return validateUploadMetadata(upload)
    })
}

function validateUploadMetadata(upload) {
  return fetch(upload.url, {
    method: 'HEAD',
    headers: {
      'Tus-Resumable': '1.0.0',
    },
  })
    .then((res) => {
      expect(res.status).toBe(200)
      expect(res.headers.get('tus-resumable')).toBe('1.0.0')
      expect(res.headers.get('upload-offset')).toBe('11')
      expect(res.headers.get('upload-length')).toBe('11')

      // The values in the Upload-Metadata header may not be in the same
      // order as we submitted them (the specification does not require
      // that). Therefore, we split the values and verify that each one
      // is present.
      const metadataStr = res.headers.get('upload-metadata')
      expect(metadataStr).toBeTruthy()
      const metadata = metadataStr.split(',')
      expect(metadata).toContain('filename aGVsbG8udHh0')
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
