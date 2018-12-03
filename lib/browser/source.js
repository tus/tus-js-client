import isReactNative from "./isReactNative";
import uriToBlob from "./uriToBlob";

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

export function getSource(input, chunkSize, callback) {
  // In React Native, when user selects a file, instead of a File or Blob, 
  // you usually get a file object {} with a uri property that contains
  // a local path to the file. We use XMLHttpRequest to fetch 
  // the file blob, before uploading with tus.
  // TODO: The __tus__forceReactNative property is currently used to force
  // a React Native environment during testing. This should be removed
  // once we move away from PhantomJS and can overwrite navigator.product
  // properly.
  if ((isReactNative || window.__tus__forceReactNative) && input && typeof input.uri !== "undefined") {
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

  callback(new Error("source object may only be an instance of File or Blob in this environment"));
}
