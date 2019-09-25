"use strict";
var http = require("http");
var url = require("url");
var util = require("util");
var httpAgent = require("_http_agent");
var events = require("events");

class MockAgent extends http.Agent {
  constructor() {
    super();
    this._caughtRequests = [];
  }
  addRequest(req, opt) {
    this._caughtRequests.push(new MockRequest(req, opt));
  }

  getLastRequest() {
    return this._caughtRequests[this._caughtRequests.length - 1];
  }
}

class MockRequest {
  constructor(req, opt) {
    this._req = req;

    // Unset the host property to force url.format to use the hostname and port
    // properties.
    opt.host = null;
    // Hide the port in the formatted URL if it is HTTP's default one.
    if (opt.port == 80) opt.port = null;

    this.url = url.format(opt);
    this.method = req.method;
    this.requestHeaders = opt.headers;
    this.params = {};
    this.params.size = opt.headers["Content-Length"];
    if (opt.headers["Content-Length"] === undefined) {
      this.params.size = 0;
      req.__originalWrite = req.write;
      req.write = (chunk) => {
        this.params.size += chunk.length;
        req.__originalWrite(chunk);
      };
    }
  }

  respondWith(options) {
    if (this._req.aborted) return;

    let res = new MockResponse();
    res.statusCode = options.status;
    res.headers = {};

    // Node's http module expects the keys for be lower cased
    for (var key in options.responseHeaders) {
      res.headers[key.toLowerCase()] = options.responseHeaders[key];
    }

    this._req.emit("response", res);

    if ("responseText" in options) {
      res.emit("data", Buffer.from(options.responseText, "utf8"));
    }

    res.emit("end");
  }

  responseError(err) {
    this._req.emit("error", err);
  }

  contentType() {
    return this.requestHeaders["Content-Type"] || "";
  }

  toString() {
    return util.format("[MockRequest %s %s]", this.method, this.url);
  }
}

class MockResponse extends events.EventEmitter {
}

let agent = new MockAgent();
let originalAgent = httpAgent.globalAgent;

class Ajax {
  install() {
    httpAgent.globalAgent = agent;
  }

  uninstall() {
    httpAgent.globalAgent = originalAgent;
  }
}

let ajax = new Ajax();
ajax.requests = {};
ajax.requests.mostRecent = function () {
  return agent.getLastRequest();
};

jasmine.Ajax = ajax;
