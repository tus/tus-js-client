# API reference

This document contains detailed explanation about alls available methods and classes. For a more gentle introduction and example, please see the [Usage Guide](/docs/usage.md).

## tus.isSupported

A boolean indicating whether the current browser/environment has the features necessary to use tus-js-client. This can be used to test support and warn the user or fallback to other file transfers methods. For example:

```js
if (!tus.isSupported) {
  alert('This browser does not support uploads. Please use a modern browser instead.')
}
```

## tus.canStoreURLs

A boolean indicating whether the current environment allows storing URLs enabling the corresponding upload to be resumed (see the `tus.Upload#resumeFromPreviousUpload` method). This value will only yield to `true` if we are in a browser environment which provides access to the
`localStorage` object or when using Node.js, where the local disk could be used. Please be aware that in some cases, e.g. a sandboxed iframe, the Web Storage API is provided but cannot be used without causing security errors. In these special situations or if no Web Storage API is available, `canStoreURLs` is set to `false`.

## tus.defaultOptions

An object containing the default options used when creating a new upload:

#### endpoint

_Default value:_ `null`

The upload creation URL which will be used to create new uploads. For example:

```js
endpoint: 'http://tusd.tusdemo.net/files/'
```

#### fingerprint

_Default value:_ Environment-specific function

A function used to generate a unique string from a corresponding file. This used to store the URL for an upload to resume. This option is only used if the `storeFingerprintForResuming` flag is set to true or when the `tus.Upload#findPreviousUploads()` method is used. To overwrite the default fingerprint method you can supply your own:

```js
fingerprint: function (file, options) {
    const value = ...
    return Promise.resolve(value)
}
```

#### onProgress

_Default value:_ `null`

An optional function that will be called each time progress information is available. The arguments will be `bytesSent` and `bytesTotal`. Please see the [FAQ](/docs/faq.md) for the difference to the `onChunkComplete` option.

#### onChunkComplete

_Default value:_ `null`

An optional function that will be called each time a `PATCH` has been successfully completed. The arguments will be `chunkSize`,
`bytesAccepted`, `bytesTotal`. Please see the [FAQ](/docs/faq.md) for the difference to the `onProgress` option.

#### onSuccess

_Default value:_ `null`

An optional function called when the upload finished successfully.

#### onError

_Default value:_ `null`

An optional function called once an error appears. The argument will be an Error instance with additional information about the involved requests. For example:

```js
onError: function (err) {
    console.log("Error", err)
    console.log("Request", err.originalRequest)
    console.log("Response", err.originalResponse)
}
```

#### onShouldRetry

_Default value:_ `null`

An optional function called once an error appears and before retrying.

When no callback is specified, the retry behavior will be the default one: any status codes of 409, 423 or any other than 4XX will be treated as a server error and the request will be retried automatically, as long as the browser does not indicate that we are offline.

When a callback is specified, its return value will influence the retry behavior: The function must return `true` if the request should be retried, `false` otherwise. The argument will be an `Error` instance with additional information about the involved requests.

Please note that the callback will not be invoked when the maximum number of retry attempts was reached.

```js
onShouldRetry: function (err, retryAttempt, options) {
    console.log("Error", err)
    console.log("Request", err.originalRequest)
    console.log("Response", err.originalResponse)

    var status = err.originalResponse ? err.originalResponse.getStatus() : 0
    // Do not retry if the status is a 403.
    if (status === 403) {
      return false
    }

    // For any other status code, we retry.
    return true
}
```

#### onUploadUrlAvailable

_Default value:_ `null`

An optional function called once the upload URL is available. At this point, the `tus.Upload#url` property is guaranteed to be accessible and valid. This occurs after inspecting the `Location` header in the response to the initial POST request, or when an upload URL is confirmed using a HEAD request. Due to network errors and retries, this callback might be invoked multiple times for a single upload.

#### headers

_Default value:_ `{}`

An object with custom header values used in all requests. Useful for adding authentication details, for example:

```js
headers: {
    "Authorization": "Bearer ..."
}
```

#### chunkSize

_Default value:_ `Infinity`

A number indicating the maximum size of a `PATCH` request body in bytes. The default value (`Infinity`) means that tus-js-client will try to upload the entire file in one request. This setting is also required if the input file is a reader/readable stream.

**Warning:** **Do not set this value**, unless you are being forced to. The only two valid reasons for setting `chunkSize` are:

- You are passing a reader or readable stream as input to tus-js-client and it will complain that it "cannot create source for stream without a finite value for the chunkSize option" if you leave `chunkSize` empty.
- You are using a tus server or proxy with a limit on how big request bodies may be.

In all other cases, **do not set this value** as it will hurt your upload performance. If in doubt, leave this value to the default or contact us for help.

If you are required to specify a value, consider this:

- A small chunk size (less than a few MBs) may reduce the upload performance dramatically. Each `PATCH` request can only carry little data, which requires more HTTP requests to transmit the whole file. All of these HTTP requests add overhead to the upload process. In addition, if the server has hard limits (such as the minimum 5 MB chunk size imposed by S3), specifying a chunk size which below outside those hard limits will cause chunked uploads to fail.
- A large chunk size (more than a GB) is problematic when a reader/readable stream is used as the input file. In these cases, tus-js-client will create an in-memory buffer with the size of `chunkSize`. This buffer is used to resume the upload if it gets interrupted. A large chunk size means a larger memory usage in this situation. Choosing a good value depends on the application and is a trade-off between available memory and upload performance.

#### metadata

_Default value:_ `{}`

An object with string values used as additional meta data which will be passed along to the server when (and only when) creating a new upload. Can be used for filenames, file types etc, for example:

```js
metadata: {
    filename: "my_image.png",
    filetype: "image/png",
    userId: "1234567"
}
```

#### uploadUrl

_Default value:_ `null`

A URL which will be used to directly attempt a resume without creating an upload first. Only if the resume attempt fails it will fall back to creating a new upload using the URL specified in the `endpoint` option. Using this option may be necessary if the server is automatically creating upload resources for you, which is the case with Vimeo's API, for example.

#### uploadSize

_Default value:_ `null`

An optional integer representing the size of the file in bytes. This will only be used if the size cannot be automatically calculated which only happens if you supply a `Readable` stream as the file to upload.

#### overridePatchMethod

_Default value:_ `false`

A boolean indicating whether the `POST` method should be used instead of `PATCH` for transferring the chunks. This may be necessary if a browser or the server does not support latter one. In this case, a `POST` request will be made with the `X-HTTP-Method-Override: PATCH` header. The server must be able to detect it, and then handle the request as if `PATCH` would have been the method.

#### retryDelays

_Default value:_ `[0, 1000, 3000, 5000]`

An array or null, indicating how many milliseconds should pass before the next attempt to uploading will be started after the transfer has been interrupted. The array's length indicates the maximum number of attempts. If the final attempt did not finish successfully, an error will be emitted using the `onError` callback. For more details about the system of retries and delays, read the [FAQ entry about automated Retries](/docs/faq.md#can-tus-js-client-automatically-retry-errored-requests).

Following example will trigger up to three retries, each after 1s, 3s and 5s respectively:

```js
retryDelays: [1000, 3000, 5000]
```

#### storeFingerprintForResuming

_Default value:_ `true`

A boolean indicating if the upload URL should be stored in the URL storage using the file's fingerprint after an new upload resource on the server has been created or an upload URL has been provided using the `uploadUrl` option. If enabled, the upload URL can later be retrieved from the URL storage using the `tus.Upload#findPreviousUploads` method. Set this value to `false` if you do not plan an resuming uploads across browser sessions.

#### removeFingerprintOnSuccess

_Default value:_ `false`

A boolean indicating if the fingerprint in the URL storage will be removed once the upload is successfully completed. When this feature is enabled and the same file is uploaded again, it will create an entirely new upload instead of reusing the previous one. Furthermore, this option will only change behavior if `urlStorage` is not `null`.

#### uploadLengthDeferred

_Default value:_ `false`

A boolean indicating whether a stream of data is going to be uploaded as a [`Reader`](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStreamDefaultReader). If so, the total size isn't available when we begin uploading, so we use the Tus [`Upload-Defer-Length`](https://tus.io/protocols/resumable-upload.html#upload-defer-length) header. Once the reader is finished, the total file size is sent to the tus server in order to complete the upload. Furthermore, `chunkSize` must be set to a finite number. See the `/demos/browser/video.js` file for an example of how to use this property.

#### uploadDataDuringCreation

_Default value:_ `false`

A boolean indicating whether the `creation-with-upload` extension should be used. If `true`, the file's content will already be transferred in the `POST` request when a new upload is created. This can improve upload speed as no additional `PATCH` request is needed. Please be aware that your tus server must support the [`creation-with-upload` extension](https://tus.io/protocols/resumable-upload.html#creation-with-upload) or otherwise errors will occur.

#### addRequestId

_Default value:_ `false`

A boolean indicating whether a random request ID should be added to every HTTP request that is sent. The request ID will be sent using the `X-Request-ID` header, so your CORS setup must allow that header. The request ID is added to error messages and can be used to correlate client errors with server logs if the tus server also adds the ID to its logs. The IDs follow the UUID v4 format, for example:

```
X-Request-ID: fe51f777-f23e-4ed9-97d7-2785cc69f961
```

#### parallelUploads

_Default value:_ `1`

A number indicating how many parts should be uploaded in parallel. If this number is not `1`, the input file will be split into multiple parts, where each part is uploaded individually in parallel. The value of `parallelUploads` determines the number of parts. Using `parallelUploadBoundaries` the size of each part can be changed. After all parts have been uploaded, the [`concatenation` extension](https://tus.io/protocols/resumable-upload.html#concatenation) will be used to concatenate all the parts together on the server-side, so the tus server must support this extension. This option should not be used if the input file is a streaming resource.

The idea behind this option is that you can use multiple HTTP requests in parallel to better utilize the full capacity of the network connection to the tus server. If you want to use it, please evaluate it under real world situations to see if it actually improves your upload performance. In common browser session, we were not able to find a performance improve for the average user.

#### parallelUploadBoundaries

_Default value:_ `null`

An array indicating the boundaries of the different parts uploaded during a parallel upload. This option is only considered if `parallelUploads` is greater than `1`. If so, the length of `parallelUploadBoundaries` must match `parallelUploads`. Each element in this array must have a `start` and `end` property indicating the start and end position of the partial upload:

```
parallelUploadBoundaries: [{ start: 0, end: 1 }, { start: 1, end: 11 }],
```

Is it the user's responsibility to ensure that the boundaries are consecutive and occupy the entire file size.

If `parallelUploadBoundaries` is `null` (default value), the upload will be split into roughly equally sized parts. This setting can be used to have parts of different size distributions or parts with specific boundaries to satisfy server requirements.

#### onBeforeRequest

_Default value:_ `null`

An optional function that will be called before a HTTP request is sent out. The argument will be an instance of the `HttpRequest` interface as defined for the `httpStack` option. This can be used to modify the outgoing request. For example, you can enable the `withCredentials` setting for XMLHttpRequests in browsers:

```js
onBeforeRequest: function (req) {
    var xhr = req.getUnderlyingObject()
    xhr.withCredentials = true
}
```

You can also return a Promise if you need to perform some calculations before the request is sent:

```js
onBeforeRequest: function (req) {
    return new Promise(resolve => {
        var xhr = req.getUnderlyingObect()
        xhr.withCredentials = true
        resolve()
    })
}
```

#### onAfterResponse

_Default value:_ `null`

An optional function that will be called after a HTTP response has been received. The arguments will be an instance of the `HttpRequest` and `HttpResponse` interface as defined for the `httpStack` option. This can be used to retrieve additional data from the server, for example:

```js
onAfterResponse: function (req, res) {
    var url = req.getURL()
    var value = res.getHeader("X-My-Header")
    console.log(`Request for ${url} responded with ${value}`)
}
```

You can also return a Promise if you need to perform some calculations before tus-js-client processes the response:

```js
onAfterResponse: function (req, res) {
    return new Promise(resolve => {
        var url = req.getURL()
        var value = res.getHeader("X-My-Header")
        console.log(`Request for ${url} responded with ${value}`)
        resolve()
    })
}
```

#### httpStack

_Default value:_ Environment-specific implementation

An object used as the HTTP stack for making network requests. This is an abstraction layer above the different network APIs on the various platforms. If you want to implement your own HTTP stack, pass an object to the `httpStack` option which conforms to the following `HttpStack` interface:

```typescript
interface HttpStack {
    createRequest(method: string, url: string): HttpRequest;
    getName(): string;
}

interface HttpRequest {
    constructor(method: string, url: string);
    getMethod(): string;
    getURL(): string;

    setHeader(header: string, value: string);
    getHeader(header: string);

    setProgressHandler((bytesSent: number): void): void;
    // Send the HTTP request with the provided request body. The value of the request body depends
    // on the platform and what `fileReader` implementation is used. With the default `fileReader`,
    // `body` can be
    // - in browsers: a TypedArray, a DataView a Blob, or null.
    // - in  Node.js: a Buffer, a ReadableStream, or null.
    send(body: any): Promise<HttpResponse>;
    abort(): Promise<void>;

    // Return an environment specific object, e.g. the XMLHttpRequest object in browsers.
    getUnderlyingObject(): any;
}

interface HttpResponse {
    getStatus(): number;
    getHeader(header: string): string;
    getBody(): string;

    // Return an environment specific object, e.g. the XMLHttpRequest object in browsers.
    getUnderlyingObject(): any;
}

```

#### urlStorage

_Default value:_ Environment-specific implementation

An object used as the URL storage for storing and retrieving upload URLs based on a file's fingerprint. The default implementation for browsers uses the Web Storage API. For Node.js, the default value is a dummy storage which discards all data to avoid memory leaks. If you want to save the upload URLs on disk, use the `tus.FileUrlStorage` class. You can use this option to implement your own storage if you want to use a specific backend for saving that data. In that case, the following `UrlStorage` interface must be used:

```typescript
interface UrlStorage {
  findAllUploads(): Promise<Array<ListEntry>>
  findUploadsByFingerprint(fingerprint: string): Promise<Array<ListEntry>>

  removeUpload(urlStorageKey: string): Promise<void>

  // Returns the URL storage key, which can be used for removing the upload.
  addUpload(fingerprint: string, upload: ListEntry): Promise<string>
}

interface ListEntry {
  size: number | null
  metadata: object
  creationTime: string
  urlStorageKey: string
}
```

#### fileReader

_Default value:_ Environment-specific implementation

An object used as the file reader to retrieve specific parts of the input file. If you want to implement your own, use the following `FileReader` interface:

```typescript
interface FileReader {
  // `input` is the same object that was passed to the `tus.Upload` constructor and is platform-specific.
  // `chunkSize` is the user-defined or default value for the `chunkSize` option.
  openFile(input: any, chunkSize: number): Promise<FileSource>
}

interface FileSource {
  // `size` is file length in bytes or `null` if no length can be determined because it is a streaming resource.
  size: number | null
  // `slice` returns a specific part of the file as requested by the range:
  // - `start` is treated inclusively and `end` is treated exclusively, just like `Blob#slice` in browsers.
  // - `start` is always a finite number, but `end` might be `Infinity`.
  // The returned result includes the requested data and indicates if the file was read completely:
  // - If data was read and the end was not reached:    `{ value: [data], done: false }`
  // - If data was read and the end has been reached:   `{ value: [data], done: true }`
  // - If no data was read because the end was reached: `{ value: null, done: true }`
  slice(start: number, end: number): Promise<SliceResult>
  // `close` frees all resources that have been allocated by this `FileReader` instance.
  close()
}

interface SliceResult {
  // Platform-specific data type which must be usable by the HTTP stack as a body.
  value: any | null
  // `done` is true if the file has been read fully and future calls to `slice` will not return new data.
  done: boolean
}
```

#### protocol

_Default value:_ `'tus-v1'`

tus-js-client uses the [tus v1.0.0 upload protocol](https://tus.io/protocols/resumable-upload) by default. It also includes experimental support for [the draft of Resumable Uploads For HTTP](https://datatracker.ietf.org/doc/draft-ietf-httpbis-resumable-upload/) developed in the HTTP working group of the IETF. By setting the `protocol` option to `'ietf-draft-03'`, tus-js-client will use the protocol as defined in the draft version 03. Please be aware that this feature is experimental and that this option might change in breaking ways in non-major releases.

## tus.Upload(file, options)

The constructor for the `tus.Upload` class. The upload will not be started automatically, use `start` to do so.

Depending on the platform, the `file` argument must be an instance of the following types:

- inside browser: `File`, `Blob`, or [`Reader`](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStreamDefaultReader)
- inside Node.js: `Buffer` or `Readable` stream
- inside Cordova: `File` object from a `FileEntry` (see [demo](demos/cordova/www/js/index.js))

The `options` argument will be merged deeply with `tus.defaultOptions`. See its documentation for more details.

If you pass a `Reader` or `Readable` stream, tus-js-client will take care of closing/cancelling the stream once the upload is complete (i.e. the `onSuccess` callback is invoked). It will not close the stream if you stop the upload prematurely using `abort()` or if an error occurs (`onError` callback) because you might want to resume the upload. If you do not want to continue the upload, you must close/cancel the stream on your own.

## tus.Upload#options

The `options` argument used in the constructor merged deeply with `tus.defaultOptions`.

## tus.Upload#file

The `file` argument used in the constructor.

## tus.Upload#url

The URL used to upload the file. This property will be set once an upload has been created, which happens at last when the `onSuccess` callback is invoked. To resume an upload from a specific URL use the `uploadUrl` option instead.

### tus.Upload#start()

Start or resume the upload using the specified file. If no `file` property is available the error handler will be called. If you supplied your own URL using the `uploadUrl` option the client will try to resume using this URL. Alternatively, you can use `tus.Upload#findPreviousUploads` and `tus.Upload#resumeFromPreviousUpload` to query the URL storage for previous uploads for this specific file. If no upload can be resume it will create a new upload using the supplied `endpoint` option.

## tus.Upload#abort(shouldTerminate)

Abort the currently running upload request and don't continue. You can resume the upload by calling the `start` method again.

Calling this method will not release the provided file because you might want to resume the upload later. If you do not want to resume and have passed a readable stream to tus-js-client, you must close/cancel the stream on your own.

The `shouldTerminate` argument is a `boolean` value that determines whether or not the upload should be terminated according to the [termination extension](https://tus.io/protocols/resumable-upload.html#termination).

The function returns a `Promise` object, which is resolved once the operation is complete, for example:

```js
var upload = new tus.Upload(...)
upload.abort(true).then(function () {
    // Upload has been aborted and terminated
}).catch(function (err) {
    // An error occurred during the termination
})
```

## tus.Upload.terminate(url, [options])

Terminate an upload based on the [termination extension](https://tus.io/protocols/resumable-upload.html#termination).

The `url` argument is the URL for the upload which you want to terminate. The `options` argument is an object with the `tus.defaultOptions` schema, which can be passed to specify certain request related options (e.g `headers`, `retryDelays`). If an error occurs during the process, the `terminate` function may retry to send the request depending on the nature of the error, and depending on whether or not the `retryDelays` options is set.

The function returns a `Promise` object, which is resolved once the operation is complete, for example:

```js
const url = 'https://tusd.tusdemo.net/files/my_upload_1'
tus.Upload.terminate(url)
  .then(function () {
    // Upload has been terminated
  })
  .catch(function (err) {
    // An error occurred during the termination
  })
```

## tus.Upload#findPreviousUploads()

Query the URL storage using the input file's fingerprint to retrieve a list of uploads for the input file, which have previously been started by the user. If you want to resume one of this uploads, pass the corresponding object to `tus.Upload#resumeFromPreviousUpload` before calling `tus.Upload#start`.

The function returns a `Promise`, which resolves to a list with following structure:

```typescript
findPreviousUploads(): Promise<Array<PreviousUpload>>;

interface PreviousUpload {
    size: number | null;
    metadata: object
    creationTime: string;
    urlStorageKey: string;
}
```

An example and more details on how to use this function can be found in the [Usage Guide](/docs/usage.md#example-let-user-select-upload-to-resume).

## tus.Upload#resumeFromPreviousUpload(previousUpload)

Configure the upload instance to resume using the upload URL as specified in `previousUpload`. The value in `previousUpload` must be an object as returned from the `tus.Upload#findPreviousUploads` method.

An example and more details on how to use this function can be found in the [Usage Guide](/docs/usage.md#example-let-user-select-upload-to-resume).
