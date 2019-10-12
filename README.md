# tus-js-client [![Build Status](https://travis-ci.org/tus/tus-js-client.svg?branch=master)](https://travis-ci.org/tus/tus-js-client)
A pure JavaScript client for the [tus resumable upload protocol](http://tus.io)
which works in browser environments, Node.js, React Native and Apache Cordova.

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

## Installation

The sources are compiled into a [UMD](https://github.com/umdjs/umd)
(`dist/tus.js`) which can be loaded using different approaches:

* **Embed using a script tag:** `<script src="dist/tus.js"></script>` and access
the tus methods using the `tus` property in `window`
* **Install from NPM:** `npm install tus-js-client`:
`var tus = require("tus-js-client")`
* **Define using AMD:** `define("alpha", ["dist/tus.js"], function(tus) {})`


## Basic Usage

1. **Create** a new `tus.Upload` instance by passing the file to be uploaded alongside additional options to its constructor.
2. **Start** the upload using the `Upload#start` function. This will create the upload resource if necessary and then transfer the file to the remote endpoint.
3. Optionally **pause** the upload if the user/application wishes to do so using `Upload#abort`. This will cause any currently running transfers to be immediately stopped.
4. Optionally **resume** the previously paused upload by called `Upload#start` again. This will resume the upload at the point at which it had stopped before. You can also use this approach to continue the upload after an error has occurred.

Please consult the documentation below for more details.

## Browser support

<a href="https://browserstack.com">
  <img alt="BrowserStack logo" src="demos/browserstack.png" align="right" />
</a>

tus-js-client is tested and known to support following browsers:

* Internet Explorer 10+
* Microsoft Edge 12+
* Mozilla Firefox 14+
* Google Chrome 20+
* Safari 6+
* Opera 12.1+
* iOS 6.0+
* Android 5.0+

Support in other browsers is *very likely* but has not been confirimed yet.
Since we only use Web Storage, XMLHttpRequest2, the File API and Blob API,
more than 95% of today's users should be able to use tus-js-client.

Compatability between browsers is continuously ensured by automated tests
in the corresponding browsers on [BrowserStack](https://browserstack.com),
who provide their great service glady for Open Source project for free.


## Node.js support

Since Node's environment is quite different than a browser's runtime and
provides other capabilities but also restrictions, tus-js-client will have a
slightly changed behavior when used in the context of a Node.js application:

* As the Web Storage API is only available in browser environments,
tus-js-client will not be able store the URLs of created uploads allowing
automatic resuming. Please consult the documentation for the `tus.canStoreURLs`
for more information on this specific topic.

* The `tus.Upload` constructor will only accept instances of `buffer.Buffer`
and `stream.Readable` as file inputs. If you are passing a readable stream as
this argument, you must set the `chunkSize` option to a finite integer value
because the chunk, which is currently being uploaded, will be held in memory
allowing automatic retries, e.g. after connection interruptions. Therefore
additional care should be taken when choosing the appropriate value for your
specific application to control memory consumption.

* If you call the `tus.Upload` constructor with an instance of the
`fs.ReadStream`, the above point does not apply, meaning *no* chunk will be held
in memory. Instead, tus-js-client will create it's own stream starting at the
needed position using `fs.createReadStream`. If you want to disable this
functionality, you may want to wrap the `fs.ReadStream` into a
`stream.PassThrough`.

Finally, you may be interested in the `demos/nodejs/index.js` example which demonstrates
a simple example on how to easily use tus-js-client using Node.js.

## React Native support

tus-js-client can be used in React Native applications with nearly all of its functionality.
Since there is no browser-like File object types in React Native, files are represented
by objects with an `uri` property (i.e. `{ uri: 'file:///...', ... }`).
tus-js-client accepts these objects and automatically resolves the file URI and
uploads the fetched file.
This allows you to directly pass the results from a file/image picker to
tus-js-client. A full example of this can be found in our
[React Native demo](/demos/reactnative/App.js).

The only unavailable feature is upload URL storage (for resuming them in later
sessions) because React Native does not implement the Web Storage API. You can
test this programmatically using the `tus.canStoreURLs` property which will
always be set to `false` in React Native environments. In the end, this means
that the `fingerprint`, `resume` and `removeFingerprintOnSuccess` options
to not have any influence on the behavior because their values are ignored
when using React Native.

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

## Extension support

The tus specification defines multiple [extensions](http://tus.io/protocols/resumable-upload.html#protocol-extensions) which can be optionally
implemented beside the core protocol enabling specific functionality. Not all
of these extensions are interesting or even useful for a client-side library
and therefore support for all of them in tus-js-client is not guaranteed.

* The **Creation** extension is mostly implemented and is used for creating the
upload. Deferring the upload's length is not possible at the moment.

* The Checksum extension requires that the checksum is calculated inside the
browser. While this is totally doable today, it's particularly expensive and
time intensive for bigger files and on mobile devices. One solution is to
utilize the new Web Crypto API, which probably offers better performance and
security, but you could argue whether it has reached critical mass yet.

* The Concatenation extension is mostly meant for parallel uploads where you
need to utilize multiple HTTP connections. In most cases, this does not apply
to the environment of the browser but it can also be used for different things.

At the moment, coverage for these extensions is not great but we promise to
improve this situation in the near future.

## Documentation

### tus.isSupported

A boolean indicating whether the current browser has the features necessary to
use tus-js-client. This can be used to test support and warn the user.

### tus.canStoreURLs

A boolean indicating whether the current environment allows storing URLs
enabling the corresponding upload to be resumed if the same file (identified
using fingerprinting) is passed to the constructor again. Since this storage
mechanism is currently bound to the Web Storage API, this value will only yield
to `true` if we are in a browser environment which provides access to the
`localStorage` object. Please be aware that in some cases, e.g. a sandboxed
iframe, the Web Storage API is provided but cannot be used without causing
security errors. In these special situations or if no Web Storage API is
available, `canStoreURLs` is set to `false`.

### tus.defaultOptions

A object containing the default options used when creating a new upload:

* `endpoint = null`: a URL which will be used to create new uploads
* `fingerprint`: a function used to generate a unique string from a
corresponding File object. This used to store the URL for an upload to resume.
This option is only used if the `resume` flag is set to true.
* `resume = true`: a boolean indicating whether the client should attempt to
resume the upload if the upload has been started in the past. This includes
storing the file's fingerprint. Use `false` to force an entire reupload.
* `onProgress = null`: a function that will be called each time progress
information is available. The arguments will be `bytesSent` and `bytesTotal`.
* `onChunkComplete = null`: a function that will be called each time a chunk
has been successfully uploaded. The arguments will be `chunkSize`,
`bytesAccepted`, `bytesTotal`.
* `onSuccess = null`: a function called when the upload finished successfully.
* `onError = null`: a function called once an error appears. The arguments will
be an Error instance.
* `headers = {}`: an object with custom header values used in all requests.
* `withCredentials = false`: a boolean which is be used as the value for
`withCredentials` in all XMLHttpRequests to use Cookies in requests. The
remote server must accept CORS and credentials.
* `chunkSize = Infinity`: a number indicating the maximum size of a chunk
in bytes which will be uploaded in a single request. This can be used when
a server or proxy has a limit on how big request bodies may be.
Note that if the server has hard limits (such as the minimum 5MB chunk
size imposed by S3), specifying a chunk size which falls
outside those hard limits will cause chunked uploads to fail.
* `metadata = {}`: an object with string values used as additional meta data
which will be passed along to the server when (and only when) creating a new
upload. Can be used for filenames, file types etc.
* `uploadUrl = null`: a URL which will be used to directly attempt a resume
without generating the fingerprint and looking it up before. If this attempt
fails it will fall back to creating a new upload using the URL specified in
`endpoint`. This will also force an attempt even if resuming has been disabled
by setting `resume` to `false`.
* `uploadSize = null`: an integer representing the size of the file in bytes.
This will only be used if the size cannot be automatically calculated. This
is currently only used and required if you supply a `Readable` stream as the
file to upload. You may also use this to limit the position until which a file
will be uploaded.
* `overridePatchMethod = false`: a boolean indicating whether the `POST` method
should be used instead of `PATCH` for transfering the chunks. This may be
necessary if a browser or the server does not support latter one. In this case,
a `POST` request will be made with the `X-HTTP-Method-Override: PATCH` header.
The server must be able to detect it, and then handle the request as if `PATCH`
would have been the method.
* `retryDelays = null`: an array or null, indicating how many milliseconds should
pass before the next attempt to uploading will be started after the transfer has
been interrupted. The array's length indicates the maximum number of attempts.
For more details about the system of retries and delays, read the
[Automated Retries](#automated-retries) section.
* `removeFingerprintOnSuccess = false`: a boolean indicating if the fingerprint
in the storage will be removed when the upload is successfully completed.
This value is `false` for not breaking the previous API contract, but we strongly
suggest to set it to `true` to avoid cluttering the storage space. The effect is
that if the same file is uploaded again, it will create an entirely new upload.
Furthermore, this option will only change behaviour if `resume` is set to `true`.
* `uploadLengthDeferred = false`: a boolean indicating whether a stream of data is going to be uploaded as a [`Reader`](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStreamDefaultReader). If so, the total size isn't available when we begin uploading, so we use the Tus [`Upload-Defer-Length`](https://tus.io/protocols/resumable-upload.html#upload-defer-length) header. Once the reader is finished, the total file size is sent to the tus server in order to complete the upload. It is recommended to set `resume` to `false` when using this option. Furthermore, `chunkSize` must be set to a finite number.
* `uploadDataDuringCreation = false`: a boolean indicating whether the `creation-with-upload` extension should be used. If `true`, the file's content will already be transferred in the POST request when a new upload is created. This can improve upload speed as no additional PATCH request is needed. Please be aware that your tus server must support the `creation-with-upload` extension or otherwise errors will occurr (Note that this option is still *experimental* and may change in future minor release, so please use it only with caution).

### new tus.Upload(file, options)

Create a new tus.Upload object. The upload will not be started automatically,
use `start` to do so.

Depending on the platform, the `file` argument must be an instance of the following types:
- inside browser: `File`, `Blob`, or [`Reader`](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStreamDefaultReader)
- inside Node.js: `Buffer` or `Readable` stream
- inside Cordova: `File` object from a `FileEntry` (see [demo](demos/cordova/www/js/index.js))

The `options` argument will be merged deeply with `tus.defaultOptions`.

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
the `uploadUrl` option the client will try to resume using this URL.
If not, the client will look up if the file has been (fully or partially)
uploaded and tries to resume.
If no upload can be resume it will create a new upload using the supplied
`endpoint` option.

### tus.Upload#abort(shouldTerminate, callback)

Abort the currently running upload request and don't continue. You can resume
the upload by calling the `start` method again.

The `shouldTerminate` argument is a `boolean` value that determines whether or not the upload
should be terminated according to the [termination extension](https://github.com/tus/tus-resumable-upload-protocol/blob/master/protocol.md#termination).

The `callback` argument is a function that would be called after the `abort` function is complete. If an `error`
occurs during the `abort` process, this `error` will be passed as argument to the `callback`.

### tus.Upload.terminate(url, [options], callback)

Terminate an upload based on the [termination extension](https://github.com/tus/tus-resumable-upload-protocol/blob/master/protocol.md#termination).

The `url` argument is the URL for the upload which you want to terminate. The `options` argument is an object with
the `tus.defaultOptions` schema, which can be passed to specify certain request related options (e.g `headers`).
The `callback` argument is a function that would be called after the `terminate` function is complete. If an `error`
occurs during the `terminate` process, this `error` will be passed as argument to the `callback`.

### Difference between onProgress and onChunkComplete

When configuring a new uploader, the `onProgress` and `onChunkComplete`
callbacks are available. While they may seem to be equal based on their
naming and the arguments, they provide different information in reality.
Progress events are emitted using the `onProgress` option and provide numbers
about how much data has been sent to the server. However, this data may not
have been received or accepted by the endpoint. Imagine a network outage where
the browser reports to have successfully sent 100 bytes, but none of them ever
reach the backend. In order to provide reliable information about whether the
chunks have been accepted by the server, `onChunkComplete` is only invoked if
we have evidence that the remote endpoint has received and accepted the
uploaded bytes. When consuming this functionality, the `chunkSize` option is
from high importance since the callback will and invoked if an entire chunk
has been uploaded.

### Automated Retries

Due to tus' support for resumability, tus-js-client has been engineered to work even under bad networking conditions and provides options for controlling how it should act in different circumstances.
One of these settings is `retryDelays` which defines whether and how often tus-js-client will attempt a retry after the upload has been unintentionally interrupted. The value may either be `null`, to fully disable the described functionality, or an array of numbers. It's length will define how often retries will be attempted before giving up and the array's values indicate the delay between the upload interruption and the start of the next attempt in milliseconds. For example, a configuration of `[0, 1000, 3000, 5000]` will result in, at most, five attempts to resume the upload, including the initial one from calling `tus.Upload#start`. The first retry will occur instantly after the interruption, while the second attempt is going to be started after waiting for one second, the third after three seconds, and so on. If the fifth and final attempt also fails, the latest error will not be caught, but passed to the provided `onError` callback.
The underlying implementation is rather straightforward: Any error which would usually trigger the `onError` callback will be caught if following criteria are matched:
- the error has been caused by networking issues, e.g. connection interruption or an unexpected/invalid response from the server, and
- the environment does not explicitly report that the client is disconnected from any network, e.g. `navigator.onLine` in modern browsers, and
- the maximum number of retries, defined by the array's length, has not been reached.

If all of these conditions are met, an attempt will be issued after applying the defined delay. Furthermore, once the client was able to successfully transfer chunks of the upload to the server, the counter for attempted retries will be reset to zero. For example, if an upload is interrupted the first delay will be applied. After reconnecting to the remote endpoint, it is able to transfer data to it until the connection is cut again. This time not the second delay will be used but the first one again because we were able to upload chunks. The reason for this behavior is that it will allow uploads to be interrupted more often than the `retryDelays` option defines, as long as we are making progress in uploading.

## Building

```bash
# Install dependencies
npm install

# Build dist/tus.js a single time
npm run build

# Build all dist files (including minification)
npm run dist

# Watch source and rebuild
npm run watch
```

## Testing

Tests are implemented using Jasmine and can be found in the `test/` directory.
In order to run the tests, open `test/SpecRunner.html` in a browser and you
should see a visual representation of the test results. No web server is
required, you can open `SpecRunner.html` using the `file:///` protocol.

Tests can also be run on SauceLabs' cloud infrastructure using `npm test`.
Before using this command, you have to set up your SauceLabs account by filling
the `SAUCE_USERNAME` and `SAUCE_ACCESS_KEY` variables else the command will fail.

## FAQ

### How can I access the upload's ID?

tus-js-client identifies and accesses uploads by their URL and *not* their ID.
Therefore, there is no direct functionality for getting the upload ID. However,
with most tus server you are able to extract the upload ID from the the upload
URL. The upload URL can be accessed using the
[`Upload#url` property](https://github.com/tus/tus-js-client#tusuploadurl) after
an upload has been started. For example, the [tusd](https://github.com/tus/tusd)
server and [tus-node-server](https://github.com/tus/tus-node-server) have URLs
such as https://master.tus.io/files/accbccf63e9afedef9fbc1e6082835dc where the
last segment is the upload URL.

## License

MIT
