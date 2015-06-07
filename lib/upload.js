let fingerprint = require("./fingerprint")
let extend = require("extend")

let defaultOptions = {
    endpoint: "",
    fingerprint,
    resume: true,
    onProgress: null,
    onSuccess: null,
    onError: null,
    headers: {},
    chunkSize: Infinity,
    withCredentials: false
}

class Upload {
    constructor(file, options) {
        this.options = extend(true, {}, defaultOptions, options)
        // The underlying File/Blob object
        this.file = file
        // The URL against which the file will be uploaded
        this.url = null

        // The underlying XHR object for the current PATCH request
        this._xhr = null
        // The fingerpinrt for the current file (set after start())
        this._fingerprint = null
        // The offset used in the current PATCH request
        this._offset = null
        // True if the current PATCH request has been aborted
        this._aborted = false
    }

    start() {
        let file = this.file

        if(!file) {
            this._emitError(new Error("tus: no file to upload provided"))
            return
        }

        if(!this.options.endpoint) {
            this._emitError(new Error("tus: no endpoint provided"))
            return
        }

        // A URL has manually been specified, so we try to resume
        if(this.url != null) {
            this._resumeUpload()
            return
        }

        // Try to find the endpoint for the file in the localStorage
        if(this.options.resume) {
            this._fingerprint = this.options.fingerprint(file)

            let resumedUrl = localStorage.getItem(this._fingerprint)
            if(resumedUrl != null) {
                this.url = resumedUrl
                this._resumeUpload()
                return
            }
        }

        // An upload has not started for the file yet, so we start a new one
        this._createUpload()
    }

    abort() {
        if(this._xhr !== null) {
            this._xhr.abort()
            this._aborted = true
        }
    }

    _emitXhrError(xhr, err) {
        err.status = xhr.status
        err.statusText = xhr.statusText
        err.responseText = xhr.responseText
        this._emitError(err)
    }

    _emitError(err) {
        if(typeof this.options.onError == "function") {
            this.options.onError(err)
        } else {
            throw err
        }
    }

    _emitSuccess() {
        if(typeof this.options.onSuccess == "function") {
            this.options.onSuccess()
        }
    }

    _emitProgress(bytesSent, bytesTotal) {
        if(typeof this.options.onProgress == "function") {
            this.options.onProgress(bytesSent, bytesTotal)
        }
    }

    /*
     * Set the headers used in the request and the withCredentials property
     * as defined in the options
     *
     * @param {XMLHttpRequest} xhr
     */
    _setupXHR(xhr) {
        xhr.setRequestHeader("Tus-Resumable", "1.0.0")
        let headers = this.options.headers
        for(var name in headers) {
            xhr.setRequestHeader(name, headers[name])
        }
        xhr.withCredentials = this.options.withCredentials
    }

    /*
     * Create a new upload using the creation extension by sending a POST
     * request to the endpoint. After successful creation the file will be
     * uploaded
     *
     * @api private
     */
    _createUpload() {
        let xhr = new XMLHttpRequest()
        xhr.open("POST", this.options.endpoint, true)

        xhr.onload = () => {
            if(!(xhr.status >= 200 && xhr.status < 300)) {
                this._emitXhrError(xhr, new Error("tus: unexpected response while creating upload"))
                return
            }

            this.url = xhr.getResponseHeader("Location")

            if(this.options.resume) {
                localStorage.setItem(this._fingerprint, this.url)
            }

            this._offset = 0
            this._startUpload()
        }

        xhr.onerror = () => {
            this._emitXhrError(xhr, new Error("tus: failed to create upload"))
        }

        this._setupXHR(xhr)
        xhr.setRequestHeader("Upload-Length", this.file.size)

        xhr.send(null)
    }

    /*
     * Try to resume an existing upload. First a HEAD request will be sent
     * to retrieve the offset. If the request fails a new upload will be
     * created. In the case of a successful response the file will be uploaded.
     *
     * @api private
     */
    _resumeUpload() {
        let xhr = new XMLHttpRequest()
        xhr.open("HEAD", this.url, true)

        xhr.onload = () => {
            if(!(xhr.status >= 200 && xhr.status < 300)) {
                if(this.options.resume) {
                    // Remove stored fingerprint and corresponding endpoint,
                    // since the file can not be found
                    localStorage.removeItem(this._fingerprint)
                }

                // Try to create a new upload
                this.url = null
                this._createUpload()
                return
            }

            let offset = parseInt(xhr.getResponseHeader("Upload-Offset"), 10)
            if(isNaN(offset)) {
                this._emitXhrError(xhr, new Error("tus: invalid or missing offset value"))
                return
            }

            this._offset = offset
            this._startUpload()
        }

        xhr.onerror = () => {
            this._emitXhrError(xhr, new Error("tus: failed to resume upload"))
        }

        this._setupXHR(xhr)
        xhr.send(null)
    }

    /*
     * Start uploading the file using PATCH requests. The file while be divided
     * into chunks as specified in the chunkSize option. During the upload
     * the onProgress event handler may be invoked multiple times.
     *
     * @api private
     */
    _startUpload() {
        let xhr = this._xhr = new XMLHttpRequest()
        xhr.open("PATCH", this.url, true)

        xhr.onload = () => {
            if(!(xhr.status >= 200 && xhr.status < 300)) {
                this._emitXhrError(xhr, new Error("tus: unexpected response while creating upload"))
                return
            }

            let offset = parseInt(xhr.getResponseHeader("Upload-Offset"), 10)
            if(isNaN(offset)) {
                this._emitXhrError(xhr, new Error("tus: invalid or missing offset value"))
                return
            }

            this._offset = offset

            if(offset == this.file.size) {
                // Yay, finally done :)
                // Emit a last progress event
                this._emitProgress(offset, offset)
                this._emitSuccess()
                return
            }

            this._startUpload()
        }

        xhr.onerror = () => {
            // Don't emit an error if the upload was aborted manually
            if(this._aborted) return

            this._emitXhrError(xhr, new Error("tus: failed to upload chunk at offset " + this._offset))
        }

        // Test support for progress events before attaching an event listener
        if("upload" in xhr) {
            xhr.upload.onprogress = (e) => {
                if(!e.lengthComputable) return
                this._emitProgress(start + e.loaded, this.file.size)
            }
        }

        this._setupXHR(xhr)

        xhr.setRequestHeader("Upload-Offset", this._offset)
        xhr.setRequestHeader("Content-Type", "application/offset+octet-stream")

        let start = this._offset
        let end = this._offset + this.options.chunkSize
        if(end === Infinity) {
            end = this.file.size
        }
        xhr.send(this.file.slice(start, end))
    }
}

module.exports = Upload
module.exports.defaultOptions = defaultOptions
