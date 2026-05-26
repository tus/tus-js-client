import type { HttpRequest, HttpResponse } from './options.js'

export class DetailedError extends Error {
  originalRequest?: HttpRequest

  originalResponse?: HttpResponse

  causingError?: Error

  constructor(message: string, causingErr?: Error, req?: HttpRequest, res?: HttpResponse) {
    super(message)

    this.originalRequest = req
    this.originalResponse = res
    this.causingError = causingErr

    if (causingErr != null) {
      message += `, caused by ${causingErr.toString()}`
    }

    if (req != null) {
      const requestId = req.getHeader('X-Request-ID') || 'n/a'
      const method = req.getMethod()
      const url = req.getURL()
      const status = res ? res.getStatus() : 'n/a'
      const body = res ? res.getBody() || '' : 'n/a'
      message += `, originated from request (method: ${method}, url: ${url}, response code: ${status}, response text: ${body}, request id: ${requestId})`
    }
    this.message = message
  }
}
