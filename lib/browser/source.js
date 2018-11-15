class FileSource {
  constructor(file) {
    this._file = file;
    this.size = file.size;
  }

  slice(start, end) {
    return this._file.slice(start, end);
  }

  close() {}
}

class CordovaFileSource {
  constructor(file) {
    this._file = file;
    this.size = file.size;
  }
   slice(start, end, ready, error) {
    let reader = new FileReader();
    reader.onload = () => {
      ready(new Uint8Array(reader.result));
    };
    reader.onerror = (err) => {
      error(err);
    };
    reader.readAsArrayBuffer(this._file.slice(start, end));
  }
   close() {}

   onSuccess() {

   }
}

export function getSource(input) {
  if (typeof window.PhoneGap != 'undefined' || typeof window.Cordova != 'undefined' || typeof window.cordova != 'undefined') {
    return new CordovaFileSource(input);
  }
  // Since we emulate the Blob type in our tests (not all target browsers
  // support it), we cannot use `instanceof` for testing whether the input value
  // can be handled. Instead, we simply check is the slice() function and the
  // size property are available.
  if (typeof input.slice === "function" && typeof input.size !== "undefined") {
    return new FileSource(input);
  }

  throw new Error("source object may only be an instance of File or Blob in this environment");
}
