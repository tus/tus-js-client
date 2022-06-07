/* eslint-disable no-console */

const fs = require('fs')
const tus = require('../..')

const path = `${__dirname}/../../README.md`
const file = fs.createReadStream(path)
const { size } = fs.statSync(path)

const options = {
  endpoint: 'https://tusd.tusdemo.net/files/',
  metadata: {
    filename: 'README.md',
    filetype: 'text/plain',
  },
  uploadSize: size,
  onError (error) {
    throw error
  },
  onProgress (bytesUploaded, bytesTotal) {
    const percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(2)
    console.log(bytesUploaded, bytesTotal, `${percentage}%`)
  },
  onSuccess () {
    console.log('Upload finished:', upload.url)
  },
}

const upload = new tus.Upload(file, options)
upload.start()
