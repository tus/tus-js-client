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
* `addRequestId = false`: a boolean indicating whether a random request ID should be added to every HTTP request that is sent. The request ID will be sent using the `X-Request-ID` header, so your CORS setup must allow that header. The request ID can be used to correlate client errors with server logs if the tus server also adds the ID to its logs.

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
the `tus.defaultOptions` schema, which can be passed to specify certain request related options (e.g `headers`, `retryDelays`).
The `callback` argument is a function that would be called after the `terminate` function is complete. If an `error`
occurs during the `terminate` process, the `terminate` function may retry to send the request depending on the nature of the error, and depending on whether or not the `retryDelays` options is set. If the request can no longer be retried, the `error` will be passed as argument to the `callback`.
