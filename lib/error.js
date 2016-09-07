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
      message += `, originated from request (response code: ${xhr.status}, response text: ${xhr.responseText})`;
    }
    this.message = message;
  }
}

export default DetailedError;
