/**
 * Helper function to create a Blob from a string.
 */
export function getBlob(str) {
  return new Blob(str.split(''))
}

/**
 * Create a promise and obtain the resolve/reject functions
 * outside of the Promise callback.
 */
function flatPromise() {
  let resolveFn
  let rejectFn
  const p = new Promise((resolve, reject) => {
    resolveFn = resolve
    rejectFn = reject
  })

  return [p, resolveFn, rejectFn]
}

/**
 * Create a spy-able function which resolves a Promise
 * once it is called.
 */
export function waitableFunction(name = 'func') {
  const [promise, resolve] = flatPromise()
  const fn = jasmine.createSpy(name, resolve).and.callThrough()

  fn.toBeCalled = () => promise
  return fn
}

/**
 * Create a Promise that resolves after the specified duration.
 */
export function wait(delay) {
  return new Promise((resolve) => {
    setTimeout(resolve, delay, 'timed out')
  })
}

/**
 * TestHttpStack implements the HTTP stack interface for tus-js-client
 * and can be used to assert outgoing requests and respond with mock data.
 */
export class TestHttpStack {
  constructor() {
    this._pendingRequests = []
    this._pendingWaits = []
  }

  createRequest(method, url) {
    return new TestRequest(method, url, (req) => {
      if (this._pendingWaits.length >= 1) {
        const handler = this._pendingWaits.shift()
        handler(req)
        return
      }

      this._pendingRequests.push(req)
    })
  }

  nextRequest() {
    if (this._pendingRequests.length >= 1) {
      return Promise.resolve(this._pendingRequests.shift())
    }

    return new Promise((resolve) => {
      this._pendingWaits.push(resolve)
    })
  }
}

export class TestRequest {
  constructor(method, url, onRequestSend) {
    this.method = method
    this.url = url
    this.requestHeaders = {}
    this.body = null
    this.bodySize = null

    this._onRequestSend = onRequestSend
    this._onProgress = () => {}
    ;[this._requestPromise, this._resolveRequest, this._rejectRequest] = flatPromise()
  }

  getMethod() {
    return this.method
  }

  getURL() {
    return this.url
  }

  setHeader(header, value) {
    this.requestHeaders[header] = value
  }

  getHeader(header) {
    return this.requestHeaders[header] || null
  }

  setProgressHandler(progressHandler) {
    this._onProgress = progressHandler
  }

  async send(body = null) {
    this.body = body

    if (body) {
      this.bodySize = await getBodySize(body)

      this._onProgress(0)
      this._onProgress(this.bodySize)
    }

    this._onRequestSend(this)
    return this._requestPromise
  }

  abort() {
    this._rejectRequest(new Error('request aborted'))
  }

  getUnderlyingObject() {
    throw new Error('not implemented')
  }

  respondWith(resData) {
    resData.responseHeaders = resData.responseHeaders || {}

    const res = new TestResponse(resData)
    this._resolveRequest(res)
  }

  responseError(err) {
    this._rejectRequest(err)
  }
}

function getBodySize(body) {
  if (body == null) {
    return null
  }

  if (
    body instanceof ArrayBuffer ||
    (typeof SharedArrayBuffer !== 'undefined' && body instanceof SharedArrayBuffer) ||
    ArrayBuffer.isView(body)
  ) {
    return body.byteLength
  }

  if (body instanceof Blob) {
    return body.size
  }

  if (body.length != null) {
    return body.length
  }

  return new Promise((resolve) => {
    body.on('readable', () => {
      while (true) {
        const chunk = body.read()
        if (chunk == null) break

        resolve(chunk.length)
      }
    })
  })
}

export class TestResponse {
  constructor(res) {
    this._response = res
  }

  getStatus() {
    return this._response.status
  }

  getHeader(header) {
    return this._response.responseHeaders[header]
  }

  getBody() {
    return this._response.responseText
  }

  getUnderlyingObject() {
    throw new Error('not implemented')
  }
}
