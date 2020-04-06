class DetailedError extends Error {
  constructor(error, causingErr = null, xhr = null) {
    super(error.message);

    this.originalRequest = xhr;
    this.causingError = causingErr;

    let message = error.message;
    if (causingErr != null) {
      message += `, caused by ${causingErr.toString()}`;
    }
    if (xhr != null) {
      const requestId = xhr.requestId || "null";
      message += `, originated from request (method: ${xhr.method}, url: ${xhr.url}, response code: ${xhr.status}, response text: ${xhr.responseText}, request id: ${requestId})`;
    }
    this.message = message;
  }
}

export default DetailedError;
