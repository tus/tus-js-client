const axios = require('axios')
const { getBlob } = require('./helpers/utils')
const tus = require('../..')

// Test timeout for end-to-end tests when uploading to real server.
const END_TO_END_TIMEOUT = 20 * 1000

describe('tus', () => {
  describe('end-to-end', () => {
    it('should upload to a real tus server', async () => {
      return new Promise((resolve, reject) => {
        var file = getBlob('hello world')
        var options = {
          endpoint: 'https://tusd.tusdemo.net/files/',
          metadata: {
            nonlatin: 'słońce',
            number  : 100,
            filename: 'hello.txt',
            filetype: 'text/plain',
          },
          onSuccess () {
            expect(upload.url).toMatch(/^https:\/\/tusd\.tusdemo\.net\/files\//)
            console.log('Upload URL:', upload.url) // eslint-disable-line no-console

            resolve(upload)
          },
          onError (err) {
            reject(err)
          },
        }

        var upload = new tus.Upload(file, options)
        upload.start()
      })
        .then(validateUploadContent)
        .then((upload) => {
          return upload.abort(true)
            .then(() => upload)
        })
        .then(validateUploadDeletion)
    }, END_TO_END_TIMEOUT)

    it('should upload to a real tus server with creation-with-upload', async () => {
      return new Promise((resolve, reject) => {
        var file = getBlob('hello world')
        var options = {
          endpoint: 'https://tusd.tusdemo.net/files/',
          metadata: {
            nonlatin: 'słońce',
            number  : 100,
            filename: 'hello.txt',
            filetype: 'text/plain',
          },
          onSuccess () {
            expect(upload.url).toMatch(/^https:\/\/tusd\.tusdemo\.net\/files\//)
            console.log('Upload URL:', upload.url) // eslint-disable-line no-console

            resolve(upload)
          },
          onError (err) {
            reject(err)
          },
        }

        var upload = new tus.Upload(file, options)
        upload.start()
      })
        .then(validateUploadContent)
    }, END_TO_END_TIMEOUT)
  })
})

function validateUploadContent (upload) {
  return axios.get(upload.url)
    .then((res) => {
      expect(res.status).toBe(200)
      expect(res.data).toBe('hello world')

      return validateUploadMetadata(upload)
    })
}

function validateUploadMetadata (upload) {
  return axios.head(upload.url, {
    headers: {
      'Tus-Resumable': '1.0.0',
    },
  }).then((res) => {
    expect(res.status).toBe(200)
    expect(res.data).toBe('')
    expect(res.headers['tus-resumable']).toBe('1.0.0')
    expect(res.headers['upload-offset']).toBe('11')
    expect(res.headers['upload-length']).toBe('11')

    // The values in the Upload-Metadata header may not be in the same
    // order as we submitted them (the specification does not require
    // that). Therefore, we split the values and verify that each one
    // is present.
    var metadataStr = res.headers['upload-metadata']
    expect(metadataStr).toBeTruthy()
    var metadata = metadataStr.split(',')
    expect(metadata).toContain('filename aGVsbG8udHh0')
    expect(metadata).toContain('filetype dGV4dC9wbGFpbg==')
    expect(metadata).toContain('nonlatin c8WCb8WEY2U=')
    expect(metadata).toContain('number MTAw')
    expect(metadata.length).toBe(4)

    return upload
  })
}

function validateUploadDeletion (upload) {
  var validateStatus = function (status) {
    return status === 404
  }

  return axios.get(upload.url, { validateStatus })
    .then((res) => {
      expect(res.status).toBe(404)

      return upload
    })
}
