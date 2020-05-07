class DetailedError extends Error {
  constructor(message, causingErr = null, req = null, res = null) {
    super(message);

    this.originalRequest = req;
    this.originalResponse = res;
    this.causingError = causingErr;

    if (causingErr != null) {
      message += `, caused by ${causingErr.toString()}`;
    }

    if (req != null) {
      const requestId = req.getHeader("X-Request-ID") || "n/a";
      const method = req.getMethod();
      const url = req.getURL();
      const status = res ? res.getStatus() : "n/a";
      const body = res ? (res.getBody() || "") : "n/a";
      message += `, originated from request (method: ${method}, url: ${url}, response code: ${status}, response text: ${body}, request id: ${requestId})`;
    }
    this.message = message;
  }
}

export default DetailedError;
