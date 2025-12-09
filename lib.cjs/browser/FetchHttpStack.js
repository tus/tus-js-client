"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FetchHttpStack = void 0;
const is_stream_1 = require("is-stream");
// TODO: Add tests for this.
class FetchHttpStack {
    createRequest(method, url) {
        return new FetchRequest(method, url);
    }
    getName() {
        return 'FetchHttpStack';
    }
}
exports.FetchHttpStack = FetchHttpStack;
class FetchRequest {
    constructor(method, url) {
        this._headers = {};
        this._controller = new AbortController();
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
        this._headers[header] = value;
    }
    getHeader(header) {
        return this._headers[header];
    }
    setProgressHandler(_progressHandler) {
        // The Fetch API currently does not expose a way to track upload progress.
    }
    async send(body) {
        if ((0, is_stream_1.readable)(body)) {
            throw new Error('Using a Node.js readable stream as HTTP request body is not supported using the Fetch API HTTP stack.');
        }
        const res = await fetch(this._url, {
            method: this._method,
            headers: this._headers,
            body,
            signal: this._controller.signal,
        });
        const resBody = await res.text();
        return new FetchResponse(res, resBody);
    }
    abort() {
        this._controller.abort();
        return Promise.resolve();
    }
    getUnderlyingObject() {
        // In the Fetch API, there is no object representing the request.
        return undefined;
    }
}
class FetchResponse {
    constructor(res, body) {
        this._res = res;
        this._body = body;
    }
    getStatus() {
        return this._res.status;
    }
    getHeader(header) {
        return this._res.headers.get(header) || undefined;
    }
    getBody() {
        return this._body;
    }
    getUnderlyingObject() {
        return this._res;
    }
}
//# sourceMappingURL=FetchHttpStack.js.map