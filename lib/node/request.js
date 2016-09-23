import * as http from "http";
import * as https from "https";
import {parse, resolve} from "url";
import {Readable, Transform} from "stream";

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

    this.upload = {};
    this.upload.onprogress = noop;

    // Ignored field
    this.withCredentials = false;
    this.responseText = "";
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
    if (body && body.size) options.headers["Content-Length"] = body.size;

    let req = this._request = (options.protocol !== "https:")? http.request(options) : https.request(options);
    req.on("response", (res) => {
      this.status = res.statusCode;
      this._resHeaders = res.headers;

      this.onload();
    });

    req.on("error", (err) => {
      this.onerror(err);
    });

    if (body instanceof Readable) {
      body.pipe(new ProgressEmitter(this.upload.onprogress)).pipe(req);
    } else {
      req.end(body);
    }
  }

  getResponseHeader(key) {
    return this._resHeaders[key.toLowerCase()];
  }

  abort() {
    if (this._request !== null) this._request.abort();
  }
}

// ProgressEmitter is a simple PassThrough-style transform stream which keeps
// track of the number of bytes which have been piped through it and will
// invoke the `onprogress` function whenever new number are available.
class ProgressEmitter extends Transform {
  constructor(onprogress) {
    super();

    this._onprogress = onprogress;
    this._position = 0;
  }

  _transform(chunk, encoding, callback) {
    this._position += chunk.length;
    this._onprogress({
      lengthComputable: true,
      loaded: this._position
    });
    callback(null, chunk);
  }
}

export function newRequest() {
  return new Request();
}

export function resolveUrl(origin, link) {
  return resolve(origin, link);
}
