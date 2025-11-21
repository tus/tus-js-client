import { DetailedError } from './DetailedError.js';
import { type HttpRequest, type HttpResponse, type PreviousUpload, type SliceType, type UploadInput, type UploadOptions } from './options.js';
export declare const defaultOptions: {
    endpoint: undefined;
    uploadUrl: undefined;
    metadata: {};
    metadataForPartialUploads: {};
    fingerprint: undefined;
    uploadSize: undefined;
    onProgress: undefined;
    onChunkComplete: undefined;
    onSuccess: undefined;
    onError: undefined;
    onUploadUrlAvailable: undefined;
    overridePatchMethod: boolean;
    headers: {};
    addRequestId: boolean;
    onBeforeRequest: undefined;
    onAfterResponse: undefined;
    onShouldRetry: typeof defaultOnShouldRetry;
    chunkSize: number;
    retryDelays: number[];
    parallelUploads: number;
    parallelUploadBoundaries: undefined;
    storeFingerprintForResuming: boolean;
    removeFingerprintOnSuccess: boolean;
    uploadLengthDeferred: boolean;
    uploadDataDuringCreation: boolean;
    urlStorage: undefined;
    fileReader: undefined;
    httpStack: undefined;
    protocol: UploadOptions["protocol"];
};
export declare class BaseUpload {
    options: UploadOptions;
    file: UploadInput;
    url: string | null;
    private _req?;
    private _fingerprint;
    private _urlStorageKey?;
    private _offset;
    private _aborted;
    private _size;
    private _source?;
    private _retryAttempt;
    private _retryTimeout?;
    private _offsetBeforeRetry;
    private _parallelUploads?;
    private _parallelUploadUrls?;
    private _uploadLengthDeferred;
    constructor(file: UploadInput, options: UploadOptions);
    findPreviousUploads(): Promise<PreviousUpload[]>;
    resumeFromPreviousUpload(previousUpload: PreviousUpload): void;
    start(): void;
    private _prepareAndStartUpload;
    /**
     * Initiate the uploading procedure for a parallelized upload, where one file is split into
     * multiple request which are run in parallel.
     *
     * @api private
     */
    private _startParallelUpload;
    /**
     * Initiate the uploading procedure for a non-parallel upload. Here the entire file is
     * uploaded in a sequential matter.
     *
     * @api private
     */
    private _startSingleUpload;
    /**
     * Abort any running request and stop the current upload. After abort is called, no event
     * handler will be invoked anymore. You can use the `start` method to resume the upload
     * again.
     * If `shouldTerminate` is true, the `terminate` function will be called to remove the
     * current upload from the server.
     *
     * @param {boolean} shouldTerminate True if the upload should be deleted from the server.
     * @return {Promise} The Promise will be resolved/rejected when the requests finish.
     */
    abort(shouldTerminate?: boolean): Promise<void>;
    private _emitError;
    private _retryOrEmitError;
    /**
     * Publishes notification if the upload has been successfully completed.
     *
     * @param {object} lastResponse Last HTTP response.
     * @api private
     */
    private _emitSuccess;
    /**
     * Publishes notification when data has been sent to the server. This
     * data may not have been accepted by the server yet.
     *
     * @param {number} bytesSent  Number of bytes sent to the server.
     * @param {number|null} bytesTotal Total number of bytes to be sent to the server.
     * @api private
     */
    private _emitProgress;
    /**
     * Publishes notification when a chunk of data has been sent to the server
     * and accepted by the server.
     * @param {number} chunkSize  Size of the chunk that was accepted by the server.
     * @param {number} bytesAccepted Total number of bytes that have been
     *                                accepted by the server.
     * @param {number|null} bytesTotal Total number of bytes to be sent to the server.
     * @api private
     */
    private _emitChunkComplete;
    /**
     * Create a new upload using the creation extension by sending a POST
     * request to the endpoint. After successful creation the file will be
     * uploaded
     *
     * @api private
     */
    private _createUpload;
    /**
     * Try to resume an existing upload. First a HEAD request will be sent
     * to retrieve the offset. If the request fails a new upload will be
     * created. In the case of a successful response the file will be uploaded.
     *
     * @api private
     */
    private _resumeUpload;
    /**
     * Start uploading the file using PATCH requests. The file will be divided
     * into chunks as specified in the chunkSize option. During the upload
     * the onProgress event handler may be invoked multiple times.
     *
     * @api private
     */
    private _performUpload;
    /**
     * _addChunktoRequest reads a chunk from the source and sends it using the
     * supplied request object. It will not handle the response.
     *
     * @api private
     */
    private _addChunkToRequest;
    /**
     * _handleUploadResponse is used by requests that haven been sent using _addChunkToRequest
     * and already have received a response.
     *
     * @api private
     */
    private _handleUploadResponse;
    /**
     * Create a new HTTP request object with the given method and URL.
     *
     * @api private
     */
    private _openRequest;
    /**
     * Remove the entry in the URL storage, if it has been saved before.
     *
     * @api private
     */
    private _removeFromUrlStorage;
    /**
     * Add the upload URL to the URL storage, if possible.
     *
     * @api private
     */
    private _saveUploadInUrlStorage;
    /**
     * Send a request with the provided body.
     *
     * @api private
     */
    _sendRequest(req: HttpRequest, body?: SliceType): Promise<HttpResponse>;
}
/**
 * determines if the request should be retried. Will only retry if not a status 4xx except a 409 or 423
 * @param {DetailedError} err
 * @returns {boolean}
 */
declare function defaultOnShouldRetry(err: DetailedError): boolean;
/**
 * Use the Termination extension to delete an upload from the server by sending a DELETE
 * request to the specified upload URL. This is only possible if the server supports the
 * Termination extension. If the `options.retryDelays` property is set, the method will
 * also retry if an error ocurrs.
 *
 * @param {String} url The upload's URL which will be terminated.
 * @param {object} options Optional options for influencing HTTP requests.
 * @return {Promise} The Promise will be resolved/rejected when the requests finish.
 */
export declare function terminate(url: string, options: UploadOptions): Promise<void>;
export {};
