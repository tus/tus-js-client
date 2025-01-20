import type { HttpProgressHandler, HttpRequest, HttpResponse, HttpStack } from '../options.js'

export class XHRHttpStack implements HttpStack {
  createRequest(method, url) {
    return new XHRRequest(method, url)
  }

  getName() {
    return 'XHRHttpStack'
  }
}

class XHRRequest implements HttpRequest {
  private _xhr = new XMLHttpRequest()

  private _method: string

  private _url: string

  private _headers: Record<string, string> = {}

  constructor(method: string, url: string) {
    this._xhr.open(method, url, true)

    this._method = method
    this._url = url
  }

  getMethod(): string {
    return this._method
  }

  getURL(): string {
    return this._url
  }

  setHeader(header: string, value: string): void {
    this._xhr.setRequestHeader(header, value)
    this._headers[header] = value
  }

  getHeader(header: string) {
    return this._headers[header]
  }

  setProgressHandler(progressHandler: HttpProgressHandler): void {
    // Test support for progress events before attaching an event listener
    if (!('upload' in this._xhr)) {
      return
    }

    this._xhr.upload.onprogress = (e) => {
      if (!e.lengthComputable) {
        return
      }

      progressHandler(e.loaded)
    }
  }

  // TODO: Validate the type of body
  send(body?: Blob): Promise<XHRResponse> {
    return new Promise((resolve, reject) => {
      this._xhr.onload = () => {
        resolve(new XHRResponse(this._xhr))
      }

      this._xhr.onerror = (err) => {
        reject(err)
      }

      this._xhr.send(body)
    })
  }

  abort(): Promise<void> {
    this._xhr.abort()
    return Promise.resolve()
  }

  getUnderlyingObject(): XMLHttpRequest {
    return this._xhr
  }
}

class XHRResponse implements HttpResponse {
  private _xhr: XMLHttpRequest

  constructor(xhr: XMLHttpRequest) {
    this._xhr = xhr
  }

  getStatus(): number {
    return this._xhr.status
  }

  getHeader(header: string): string | undefined {
    return this._xhr.getResponseHeader(header) || undefined
  }

  getBody(): string {
    return this._xhr.responseText
  }

  getUnderlyingObject(): XMLHttpRequest {
    return this._xhr
  }
}
