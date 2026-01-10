import { readable as isNodeReadableStream } from 'is-stream';
export class XHRHttpStack {
    createRequest(method, url) {
        return new XHRRequest(method, url);
    }
    getName() {
        return 'XHRHttpStack';
    }
}
class XHRRequest {
    constructor(method, url) {
        this._xhr = new XMLHttpRequest();
        this._headers = {};
        this._xhr.open(method, url, true);
        this._method = method;
        this._url = url;
    }
    getMethod() {
        return this._method;
    }
    getURL() {
        return this._url;
    }
    setHeader(header, value) {
        this._xhr.setRequestHeader(header, value);
        this._headers[header] = value;
    }
    getHeader(header) {
        return this._headers[header];
    }
    setProgressHandler(progressHandler) {
        // Test support for progress events before attaching an event listener
        if (!('upload' in this._xhr)) {
            return;
        }
        this._xhr.upload.onprogress = (e) => {
            if (!e.lengthComputable) {
                return;
            }
            progressHandler(e.loaded);
        };
    }
    send(body) {
        if (isNodeReadableStream(body)) {
            throw new Error('Using a Node.js readable stream as HTTP request body is not supported using the XMLHttpRequest HTTP stack.');
        }
        return new Promise((resolve, reject) => {
            this._xhr.onload = () => {
                resolve(new XHRResponse(this._xhr));
            };
            this._xhr.onerror = (err) => {
                reject(err);
            };
            this._xhr.send(body);
        });
    }
    abort() {
        this._xhr.abort();
        return Promise.resolve();
    }
    getUnderlyingObject() {
        return this._xhr;
    }
}
class XHRResponse {
    constructor(xhr) {
        this._xhr = xhr;
    }
    getStatus() {
        return this._xhr.status;
    }
    getHeader(header) {
        return this._xhr.getResponseHeader(header) || undefined;
    }
    getBody() {
        return this._xhr.responseText;
    }
    getUnderlyingObject() {
        return this._xhr;
    }
}
//# sourceMappingURL=XHRHttpStack.js.map