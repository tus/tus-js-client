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

  slice(start, end) {
    return new Promise((_resolve, _error) => {
      let reader = new FileReader();
      reader.onload = () => {
        _resolve(new Uint8Array(reader.result));
        reader = null;
      };
      reader.onerror = (event) => {
        _error(event);
        reader = null;
      };
      reader.readAsArrayBuffer(this._file.slice(start, end));
    });
  }

  close() {}
}

export function getSource(input) {

  // Are we using cordova and this is a cordova file?
  if (input && input.localURL && input.localURL.indexOf('cdvfile') === 0) {
    return new CordovaFileSource(input)
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
