import type { HttpProgressHandler, HttpRequest, HttpResponse, HttpStack } from '../options.js'

// TODO: Add tests for this.
export class FetchHttpStack implements HttpStack {
  createRequest(method: string, url: string) {
    return new FetchRequest(method, url)
  }

  getName() {
    return 'FetchHttpStack'
  }
}

class FetchRequest implements HttpRequest {
  private _method: string
  private _url: string
  private _headers: Record<string, string> = {}
  private _controller = new AbortController()

  constructor(method: string, url: string) {
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
    this._headers[header] = value
  }

  getHeader(header: string) {
    return this._headers[header]
  }

  setProgressHandler(_progressHandler: HttpProgressHandler): void {
    // The Fetch API currently does not expose a way to track upload progress.
  }

  async send(body?: Blob): Promise<FetchResponse> {
    const res = await fetch(this._url, {
      method: this._method,
      headers: this._headers,
      body,
      signal: this._controller.signal,
    })

    const resBody = await res.text()
    return new FetchResponse(res, resBody)
  }

  abort(): Promise<void> {
    this._controller.abort()
    return Promise.resolve()
  }

  getUnderlyingObject(): undefined {
    // In the Fetch API, there is no object representing the request.
    return undefined
  }
}

class FetchResponse implements HttpResponse {
  private _res: Response
  private _body: string

  constructor(res: Response, body: string) {
    this._res = res
    this._body = body
  }

  getStatus(): number {
    return this._res.status
  }

  getHeader(header: string): string | undefined {
    return this._res.headers.get(header) || undefined
  }

  getBody(): string {
    return this._body
  }

  getUnderlyingObject(): Response {
    return this._res
  }
}
