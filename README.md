# tus-js-client
A pure JavaScript client for the [tus resumable upload protocol](http://tus.io).

## Example

```js
input.addEventListener("change", function(e) {
    // Get the selected file from the input element
    var file = e.target.files[0]

    // Create a new tus upload
    var upload = new tus.Upload(file, {
        endpoint: "http://localhost:1080/files/",
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

## Installation

The sources are compiled into a [UMD](https://github.com/umdjs/umd)
(`dist/tus.js`) which can be loaded using different approaches:

* **Embed using a script tag:** `<script src="dist/tus.js"></script>` and access
the tus methods using the `tus` property in `window`
* **Install from NPM:** `npm install tus-js-client` and load using browserify:
`var tus = require("tus-js-client")`
* **Define using AMD:** `define("alpha", ["dist/tus.js"], function(tus) {})`

## Browser support

We use localStorage, XMLHttpRequest2, the File API and Blob API. About 85% of
today's users should be able to use this software, calculated using
[iwanttouse.com](http://www.iwanttouse.com/#namevalue-storage,xhr2,fileapi,blobbuilder).

## Internals

Once a new file should be uploaded the client will create a new upload resource
on the server using a `POST` request. A successful response will contain a
`Location` header pointing to the upload URL. This URL will be used to transfer
the file to the server using one or multiple `PATCH` requests.
In addition tus-js-client will generate a unique fingerprint for every file and
store it and the upload URL using the Web Storage API. If the upload is
interrupted or aborted manually, the client is able to resume the upload by
retrieving the upload URL using the fingerprint. The client is even able to
resume after you close your browser or shut down your device. Now the client can
continue to send `PATCH` requests to the server until the upload is finished.

## Documentation

### tus.isSupported

A boolean indicating whether the current browser has the features necessary to
use tus-js-client. This can be used to test support and warn the user.

### tus.defaultOptions

A object containing the default options used when creating a new upload:

* `endpoint = ""`: a URL which will be used to create new uploads
* `fingerprint`: a function used to generate a unique string from a
corresponding File object. This used to store the URL for an upload to resume.
* `resume = true`: a boolean indicating whether the client should attempt to
resume the upload if the upload has been started in the past. This includes
storing the file's fingerprint. Use `false` to force an entire reupload.
* `onProgress = null`: a function will be be called each time progress information
is available. The arguments will be `bytesUploaded` and `bytesTotal`.
* `onSuccess = null`: a function called when the upload finished successfully.
* `onError = null`: a function called once an error appears. The arguments will
be an Error instance.
* `headers = {}`: a object with custom header values used in all requests.
* `withCredentials = false`: a boolean which is be used as the value for
`withCredentials` in all XMLHttpRequests to use Cookies in requests. The
remote server must accept CORS and credentials.
* `chunkSize = Infinity`: a number indicating the maximum size of a chunk
uploaded in a single request

### new tus.Upload(file, options)

Create a new tus.Upload object. The upload will not be started automatically,
use `start` to do so.

The `file` argument should be an instance of `File` or `Blob`. The `options`
argument will be merged deeply with `tus.defaultOptions`.

### tus.Upload#options

The `options` argument used in the constructor merged deeply with
`tus.defaultOptions`.

### tus.Upload#file

The `file` argument used in the constructor.

### tus.Upload#url

The URL used to upload the file. Leave it set to `null` and the client will
create a new upload and set this property to the new upload URL.
You may supply your own URL using this property and the client will try to
resume using this URL.

### tus.Upload#start()

Start or resume the upload using the specified file. If no `file` property is
available the error handler will be called. If you supplied your own URL using
the `url` property the client will try to resume using this URL.
If not, the client will look up if the file has been (fully or partially)
uploaded and tries to resume.
If no upload can be resume it will create a new upload using the supplied
`endpoint` option.

### tus.Upload#abort()

Abort the currently running upload request and don't continue. You can resume
the upload by calling the `start` method again.

## Building

```bash
# Install dependencies
npm install

# Build dist/tus.js a single time
npm run build

# Watch source and rebuild
npm run watch
```

## Testing

To be done…

## License

MIT
