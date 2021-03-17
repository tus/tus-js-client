/* eslint no-console: 0 */

var fs = require('fs')
var tus = require('../..')

var path = `${__dirname}/../../README.md`
var file = fs.createReadStream(path)
var size = fs.statSync(path).size

var options = {
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
    var percentage = (bytesUploaded / bytesTotal * 100).toFixed(2)
    console.log(bytesUploaded, bytesTotal, `${percentage}%`)
  },
  onSuccess () {
    console.log('Upload finished:', upload.url)
  },
}

var upload = new tus.Upload(file, options)
upload.start()
