import type { HttpRequest, HttpResponse } from './options.js'
import type { TusDetailedErrorRequestContext } from './protocol_generated.js'
import {
  TUS_REQUEST_ID_HEADER_NAME,
  tusDetailedErrorEmptyResponseBody,
  tusDetailedErrorMessage,
  tusDetailedErrorMissingValue,
} from './protocol_generated.js'

export class DetailedError extends Error {
  originalRequest?: HttpRequest

  originalResponse?: HttpResponse

  causingError?: Error

  constructor(message: string, causingErr?: Error, req?: HttpRequest, res?: HttpResponse) {
    super(message)

    this.originalRequest = req
    this.originalResponse = res
    this.causingError = causingErr

    let requestContext: TusDetailedErrorRequestContext | undefined
    if (req != null) {
      requestContext = {
        body: res
          ? res.getBody() || tusDetailedErrorEmptyResponseBody()
          : tusDetailedErrorMissingValue(),
        method: req.getMethod(),
        requestId: req.getHeader(TUS_REQUEST_ID_HEADER_NAME) || tusDetailedErrorMissingValue(),
        status: res ? res.getStatus() : tusDetailedErrorMissingValue(),
        url: req.getURL(),
      }
    }

    this.message = tusDetailedErrorMessage({
      baseMessage: message,
      cause: causingErr?.toString(),
      requestContext,
    })
  }
}
