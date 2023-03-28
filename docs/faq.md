# Frequently asked questions

## How does tus work internally?

Once a new file should be uploaded, the client will create a new upload resource on the server using a `POST` request. A successful response will contain a
`Location` header pointing to the upload URL. This URL will be used to transfer the file to the server using one or multiple `PATCH` requests.
In addition tus-js-client will generate a unique fingerprint for every file and store it and the upload URL using the Web Storage API. If the upload is interrupted or aborted manually, the client is able to resume the upload by retrieving the upload URL using the fingerprint. The client is even able to resume after you close your browser or shut down your device. Now the client can continue to send `PATCH` requests to the server until the upload is finished.

## How can I access the upload's ID?

tus-js-client identifies and accesses uploads by their URL and _not_ their ID. Therefore, there is no direct functionality for getting the upload ID. However, with most tus server you are able to extract the upload ID from the the upload URL. The upload URL can be accessed using the [`Upload#url` property](https://github.com/tus/tus-js-client#tusuploadurl) after an upload has been started. For example, the [tusd](https://github.com/tus/tusd) server and [tus-node-server](https://github.com/tus/tus-node-server) have URLs such as https://tusd.tusdemo.net/files/accbccf63e9afedef9fbc1e6082835dc where the last segment is the upload URL.

## Which tus extensions does tus-js-client support?

The tus specification defines multiple [extensions](http://tus.io/protocols/resumable-upload.html#protocol-extensions) which can be optionally implemented beside the core protocol to get access to specific functionality. Not all of these extensions are interesting or even useful for a client-side library and therefore support for all of them in tus-js-client is not guaranteed.

- The **Creation** extension is fully implemented and is used for creating the upload. Deferring the upload's length is also possible.

- The **Concatenation** extension is mostly meant for parallel uploads where you need to utilize multiple HTTP connections. This is implemented in tus-js-client using the `parallelUploads` option in the `tus.Upload` constructor. Please see the API reference for more details.

- The Checksum extension requires that the checksum is calculated inside the browser. While this is totally doable today, it's particularly expensive and time intensive for bigger files and on mobile devices. One solution is to utilize the new Web Crypto API, which probably offers better performance and security, but you could argue whether it has reached critical mass yet.

### What is the difference between onProgress and onChunkComplete?

When configuring a new uploader, the `onProgress` and `onChunkComplete` callbacks are available. While they may seem to be equal based on their naming and the arguments, they provide different information in reality. Progress events are emitted using the `onProgress` option and provide numbers about how much data has been sent to the server. However, this data may not have been received or accepted by the endpoint. Imagine a network outage where the browser reports to have successfully sent 100 bytes, but none of them ever reach the backend. In order to provide reliable information about whether the chunks have been accepted by the server, `onChunkComplete` is only invoked if we have evidence that the remote endpoint has received and accepted the uploaded bytes. When consuming this functionality, the `chunkSize` option is from high importance since the callback will and invoked if an entire chunk has been uploaded.

### Can tus-js-client automatically retry errored requests?

Due to tus' support for resumability, tus-js-client has been engineered to work even under bad networking conditions and provides options for controlling how it should act in different circumstances.
One of these settings is `retryDelays` which defines if and how often tus-js-client will attempt a retry when the upload has been unintentionally interrupted. The value may either be `null`, to fully disable the described functionality, or an array of numbers. It's length will define how often retries will be attempted before giving up and the array's values indicate the delay between the upload interruption and the start of the next attempt in milliseconds. For example, a configuration of `[0, 1000, 3000, 5000]` will result in, at most, five attempts to resume the upload, including the initial one from calling `tus.Upload#start`. The first retry will occur instantly after the interruption, while the second attempt is going to be started after waiting for one second, the third after three seconds, and so on. If the fifth and final attempt also fails, the latest error will not be caught, but passed to the provided `onError` callback. The underlying implementation is rather straightforward: Any error which would usually trigger the `onError` callback will be caught if following criteria are matched:

- the error has been caused by networking issues, e.g. connection interruption or an unexpected/invalid response from the server, and
- the environment does not explicitly report that the client is disconnected from any network, e.g. `navigator.onLine` in modern browsers, and
- the maximum number of retries, defined by the array's length, has not been reached.

If all of these conditions are met, an attempt will be issued after applying the defined delay. Furthermore, once the client was able to successfully transfer chunks of the upload to the server, the counter for attempted retries will be reset to zero. For example, if an upload is interrupted the first delay will be applied. After reconnecting to the remote endpoint, it is able to transfer data to it until the connection is cut again. This time not the second delay will be used but the first one again because we were able to upload chunks. The reason for this behavior is that it will allow uploads to be interrupted more often than the `retryDelays` option defines, as long as we are making progress in uploading.
