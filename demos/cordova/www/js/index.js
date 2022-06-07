/* global tus Camera */
/* eslint-disable no-alert */

let upload = null
let uploadIsRunning = false
let file = null

const uploadButton = document.querySelector('#js-upload-button')
const fileInput = document.querySelector('#js-upload-file')
const fileLink = document.querySelector('#js-file-link')
const progressBar = document.querySelector('#js-upload-progress')
const progressText = document.querySelector('#js-upload-progress-text')
const uploadLink = document.querySelector('#js-upload-link')

fileInput.addEventListener('click', openFilePicker)

function resetUpload () {
  if (upload) {
    upload.abort()
    upload = null
  }

  uploadButton.textContent = 'Start Upload'
  uploadLink.textContent = 'not available yet'
  progressText.textContent = ''
  progressBar.removeAttribute('value')
}

uploadButton.addEventListener('click', toggleUpload)

function openFilePicker () {
  resetUpload()

  const options = {
    // Camera is a global cordova-specific object used for configuring camera access.
    // See https://cordova.apache.org/docs/en/latest/reference/cordova-plugin-camera/#module_Camera
    destinationType   : Camera.DestinationType.FILE_URI,
    sourceType        : Camera.PictureSourceType.PHOTOLIBRARY,
    encodingType      : Camera.EncodingType.JPEG,
    mediaType         : Camera.MediaType.PICTURE,
    // Allow simple editing of image before selection.
    allowEdit         : true,
    // Rotate the image to correct for the orientation of the device during
    // capture to fix orientation quirks on Android
    correctOrientation: true,
  }

  navigator.camera.getPicture(getFileEntry, (error) => {
    window.alert(`Unable to obtain picture: ${error}`)
  }, options)
}

function getFileEntry (imgUri) {
  window.resolveLocalFileSystemURL(imgUri, (fileEntry) => {
    fileEntry.file((fileObj) => {
      file = fileObj
      fileLink.textContent = file.name
    })
  }, (error) => {
    window.alert(`Could not create FileEntry: ${error}`)
  })
}

function toggleUpload () {
  if (!upload) {
    if (!file) return

    const options = {
      endpoint   : 'https://tusd.tusdemo.net/files/',
      retryDelays: [0, 1000, 3000, 5000],
      metadata   : {
        filename: file.name,
        filetype: file.type,
      },
      onError (error) {
        if (error.originalRequest) {
          if (window.confirm(`Failed because: ${error}\nDo you want to retry?`)) {
            upload.start()
            uploadIsRunning = true
            return
          }
        } else {
          window.alert(`Failed because: ${error}`)
        }

        resetUpload()
      },
      onProgress (bytesUploaded, bytesTotal) {
        const progress = bytesUploaded / bytesTotal
        const percentage = `${(progress * 100).toFixed(2)}%`
        progressBar.value = progress
        progressText.textContent = percentage
      },
      onSuccess () {
        const anchor = document.createElement('a')
        anchor.textContent = `Download ${upload.file.name} (${upload.file.size} bytes)`
        anchor.target = '_blank'
        anchor.href = upload.url

        uploadLink.innerHTML = ''
        uploadLink.appendChild(anchor)
      },
    }

    upload = new tus.Upload(file, options)

    upload.start()
    uploadIsRunning = true
    uploadButton.textContent = 'Pause Upload'
  } else if (uploadIsRunning) {
    upload.abort()
    uploadButton.textContent = 'Resume Upload'
    uploadIsRunning = false
  } else {
    upload.start()
    uploadButton.textContent = 'Pause Upload'
    uploadIsRunning = true
  }
}
