import * as http from "http";
import * as https from "https";
import {parse, resolve} from "url";
import {Readable, Transform} from "stream";
import throttle from "lodash.throttle";

function noop() {}

class Request {
  constructor() {
    this._method = "";
    this._url = "";
    this._headers = {};
    this._resHeaders = {};
    this._request = null;
    this._aborted = false;

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

    let req = this._request = (options.protocol !== "https:") ? http.request(options) : https.request(options);
    req.on("response", (res) => {
      if (this._aborted) return;

      this.status = res.statusCode;
      this._resHeaders = res.headers;

      const resChunks = [];
      res.on("data", (data) => {
        resChunks.push(data);
      });

      res.on("end", () => {
        this.responseText = Buffer.concat(resChunks).toString("utf8");
        this.onload();
      });
    });

    req.on("error", (err) => {
      if (this._aborted) return;

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
    this._aborted = true;
    if (this._request !== null) this._request.abort();
  }
}

// ProgressEmitter is a simple PassThrough-style transform stream which keeps
// track of the number of bytes which have been piped through it and will
// invoke the `onprogress` function whenever new number are available.
class ProgressEmitter extends Transform {
  constructor(onprogress) {
    super();

    // The _onprogress property will be invoked, whenever a chunk is piped
    // through this transformer. Since chunks are usually quite small (64kb),
    // these calls can occur frequently, especially when you have a good
    // connection to the remote server. Therefore, we are throtteling them to
    // prevent accessive function calls.
    this._onprogress = throttle(onprogress, 100, {
      leading: true,
      trailing: false
    });
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
