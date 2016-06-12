import * as http from "http";
import {parse} from "url";

function noop() {}

class Request {
  constructor() {
    this._method = "";
    this._url = "";
    this._headers = {};
    this._resHeaders = {};
    this._request = null;

    this.status = 0;

    this.onerror = noop;
    this.onload = noop;

    // Ignored field
    this.withCredentials = false;
  }

  open(method, url) {
    this._method = method;
    this._url = url;
  }

  setRequestHeader(key, value) {
    this._headers[key] = value;
  }

  send(body) {
    let options = parse(this._url);
    options.method = this._method;
    options.headers = this._headers;
    if (body) options.headers["Content-Length"] = body.size;

    let req = this._request = http.request(options);
    req.on("response", (res) => {
      this.status = res.statusCode;
      this._resHeaders = res.headers;

      this.onload();
    });

    req.on("error", () => {
      this.onerror();
    });

    req.end(body);
  }

  getResponseHeader(key) {
    return this._resHeaders[key.toLowerCase()];
  }

  abort() {
    if (this._req !== null) this._req.abort();
  }
}

export function newRequest() {
  return new Request();
}
