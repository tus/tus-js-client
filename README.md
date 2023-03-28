# tus-js-client

<img alt="Tus logo" src="https://github.com/tus/tus.io/blob/main/assets/img/tus1.png?raw=true" width="30%" align="right" />

> **tus** is a protocol based on HTTP for _resumable file uploads_. Resumable
> means that an upload can be interrupted at any moment and can be resumed without
> re-uploading the previous data again. An interruption may happen willingly, if
> the user wants to pause, or by accident in case of an network issue or server
> outage.

tus-js-client is a pure **JavaScript** client for the [tus resumable upload protocol](http://tus.io) and can be used inside **browsers**, **Node.js**,
**React Native** and **Apache Cordova** applications.

**Protocol version:** 1.0.0

This branch contains tus-js-client v3. If you are looking for the previous major release, after which [breaking changes](https://tus.io/blog/2022/08/03/tus-js-client-300.html) have been introduced, please look at the [v2.3.2 tag](https://github.com/tus/tus-js-client/tree/v2.3.2).

## Example

```js
input.addEventListener('change', function (e) {
  // Get the selected file from the input element
  var file = e.target.files[0]

  // Create a new tus upload
  var upload = new tus.Upload(file, {
    endpoint: 'http://localhost:1080/files/',
    retryDelays: [0, 3000, 5000, 10000, 20000],
    metadata: {
      filename: file.name,
      filetype: file.type,
    },
    onError: function (error) {
      console.log('Failed because: ' + error)
    },
    onProgress: function (bytesUploaded, bytesTotal) {
      var percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(2)
      console.log(bytesUploaded, bytesTotal, percentage + '%')
    },
    onSuccess: function () {
      console.log('Download %s from %s', upload.file.name, upload.url)
    },
  })

  // Check if there are any previous uploads to continue.
  upload.findPreviousUploads().then(function (previousUploads) {
    // Found previous uploads so we select the first one.
    if (previousUploads.length) {
      upload.resumeFromPreviousUpload(previousUploads[0])
    }

    // Start the upload
    upload.start()
  })
})
```

## Documentation

- [Installation & Requirements](/docs/installation.md)
- [Usage & Examples](/docs/usage.md)
- [API Reference](/docs/api.md)
- [Contribution Guidelines](/docs/contributing.md)
- [FAQ & Common issues](/docs/faq.md)

## Build status

[![Actions Status](https://github.com/tus/tus-js-client/workflows/CI/badge.svg)](https://github.com/tus/tus-js-client/actions)

## License

This project is licensed under the MIT license, see `LICENSE`.
