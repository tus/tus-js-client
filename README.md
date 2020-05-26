# tus-js-client

<img alt="Tus logo" src="https://github.com/tus/tus.io/blob/master/assets/img/tus1.png?raw=true" width="30%" align="right" />

> **tus** is a protocol based on HTTP for *resumable file uploads*. Resumable
> means that an upload can be interrupted at any moment and can be resumed without
> re-uploading the previous data again. An interruption may happen willingly, if
> the user wants to pause, or by accident in case of an network issue or server
> outage.

tus-js-client is a pure **JavaScript** client for the [tus resumable upload protocol](http://tus.io) and can be used inside **browsers**, **Node.js**,
**React Native** and **Apache Cordova** applications.

**Protocol version:** 1.0.0

This branch contains tus-js-client v2. If you are looking for the previous major release, after which [breaking changes](https://tus.io/blog/2020/05/04/tus-js-client-200/) have been introduced, please look at the [v1.8.0 tag](https://github.com/tus/tus-js-client/tree/v1.8.0).

## Example

```js
input.addEventListener("change", function(e) {
    // Get the selected file from the input element
    var file = e.target.files[0]

    // Create a new tus upload
    var upload = new tus.Upload(file, {
        endpoint: "http://localhost:1080/files/",
        retryDelays: [0, 3000, 5000, 10000, 20000],
        metadata: {
            filename: file.name,
            filetype: file.type
        },
        onError: function(error) {
            console.log("Failed because: " + error)
        },
        onProgress: function(bytesUploaded, bytesTotal) {
            var percentage = (bytesUploaded / bytesTotal * 100).toFixed(2)
            console.log(bytesUploaded, bytesTotal, percentage + "%")
        },
        onSuccess: function() {
            console.log("Download %s from %s", upload.file.name, upload.url)
        }
    })

    // Start the upload
    upload.start()
})
```

## Documentation

* [Installation & Requirements](/docs/installation.md)
* [Usage & Examples](/docs/usage.md)
* [API Reference](/docs/api.md)
* [Contribution Guidelines](/docs/contributing.md)
* [FAQ & Common issues](/docs/faq.md)

## Build status

[![Build Status](https://travis-ci.org/tus/tus-js-client.svg?branch=master)](https://travis-ci.org/tus/tus-js-client)

## License

This project is licensed under the MIT license, see `LICENSE`.
