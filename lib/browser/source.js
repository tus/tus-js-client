import isReactNative from "./isReactNative";
import uriToBlob from "./uriToBlob";
import isCordova from "./isCordova";
import readAsByteArray from "./readAsByteArray";

class FileSource {
  constructor(file) {
    this._file = file;
    this.size = file.size;
  }

  slice(start, end, callback) {
    // In Apache Cordova applications, a File must be resolved using
    // FileReader instances, see
    // https://cordova.apache.org/docs/en/8.x/reference/cordova-plugin-file/index.html#read-a-file
    if (isCordova()) {
      readAsByteArray(this._file.slice(start, end), (err, chunk) => {
        if (err) return callback(err);

        callback(null, chunk);
      });
      return;
    }

    callback(null, this._file.slice(start, end));
  }

  close() {}
}

class StreamSource {
  constructor(reader, chunkSize) {
    this._chunkSize = chunkSize;
    this._buffer = undefined;
    this._bufferOffset = 0;
    this._reader = reader;
    this._done = false;
  }

  slice(start, end, callback) {
    if (start < this._bufferOffset) {
      callback(new Error("Requested data is before the reader's current offset"));
      return;
    }

    return this._readUntilEnoughDataOrDone(start, end, callback);
  }

  _readUntilEnoughDataOrDone(start, end, callback) {
    const hasEnoughData = end <= this._bufferOffset + len(this._buffer);
    if (this._done || hasEnoughData) {
      var value = this._getDataFromBuffer(start, end);
      callback(null, value, value == null ? this._done : false);
      return;
    }
    this._reader.read().then(({ value, done }) => {
      if (done) {
        this._done = true;
      } else if (this._buffer === undefined) {
        this._buffer = value;
      } else {
        this._buffer = concat(this._buffer, value);
      }

      this._readUntilEnoughDataOrDone(start, end, callback);
    }).catch(err => {
      callback(new Error("Error during read: "+err));
    });
  }

  _getDataFromBuffer(start, end) {
    // Remove data from buffer before `start`.
    // Data might be reread from the buffer if an upload fails, so we can only
    // safely delete data when it comes *before* what is currently being read.
    if (start > this._bufferOffset) {
      this._buffer = this._buffer.slice(start - this._bufferOffset);
      this._bufferOffset = start;
    }
    // If the buffer is empty after removing old data, all data has been read.
    const hasAllDataBeenRead = len(this._buffer) === 0;
    if (this._done && hasAllDataBeenRead) {
      return null;
    }
    // We already removed data before `start`, so we just return the first
    // chunk from the buffer.
    return this._buffer.slice(0, end - start);
  }

  close() {
    if (this._reader.cancel) {
      this._reader.cancel();
    }
  }
}

function len(blobOrArray) {
  if (blobOrArray === undefined) return 0;
  if (blobOrArray.size !== undefined) return blobOrArray.size;
  return blobOrArray.length;
}

/*
  Typed arrays and blobs don't have a concat method.
  This function helps StreamSource accumulate data to reach chunkSize.
*/
function concat(a, b) {
  if (a.concat) { // Is `a` an Array?
    return a.concat(b);
  }
  if (a instanceof Blob) {
    return new Blob([a,b], {type: a.type});
  }
  if (a.set) { // Is `a` a typed array?
    var c = new a.constructor(a.length + b.length);
    c.set(a);
    c.set(b, a.length);
    return c;
  }
  throw new Error("Unknown data type");
}

export function getSource(input, chunkSize, callback) {
  // In React Native, when user selects a file, instead of a File or Blob,
  // you usually get a file object {} with a uri property that contains
  // a local path to the file. We use XMLHttpRequest to fetch
  // the file blob, before uploading with tus.
  if (isReactNative() && input && typeof input.uri !== "undefined") {
    uriToBlob(input.uri, (err, blob) => {
      if (err) {
        return callback(new Error("tus: cannot fetch `file.uri` as Blob, make sure the uri is correct and accessible. " + err));
      }
      callback(null, new FileSource(blob));
    });
    return;
  }

  // Since we emulate the Blob type in our tests (not all target browsers
  // support it), we cannot use `instanceof` for testing whether the input value
  // can be handled. Instead, we simply check is the slice() function and the
  // size property are available.
  if (typeof input.slice === "function" && typeof input.size !== "undefined") {
    callback(null, new FileSource(input));
    return;
  }

  if (typeof input.read === "function") {
    chunkSize = +chunkSize;
    if (!isFinite(chunkSize)) {
      callback(new Error("cannot create source for stream without a finite value for the `chunkSize` option"));
      return;
    }
    callback(null, new StreamSource(input, chunkSize));
    return;
  }

  callback(new Error("source object may only be an instance of File, Blob, or Reader in this environment"));
}
