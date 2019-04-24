/* global window */
import Upload from "./upload";
import * as storage from "./node/storage";

const {defaultOptions} = Upload;

const moduleExport = {
  Upload,
  canStoreURLs: storage.canStoreURLs,
  defaultOptions
};

if (typeof window !== "undefined") {
  // Browser environment using XMLHttpRequest
  const {XMLHttpRequest, Blob} = window;

  moduleExport.isSupported = (
    XMLHttpRequest &&
    Blob &&
    typeof Blob.prototype.slice === "function"
  );
} else {
  // Node.js environment using http module
  moduleExport.isSupported = true;
  // make FileStorage module available as it will not be set by default.
  moduleExport.FileStorage = storage.FileStorage;
}

// The usage of the commonjs exporting syntax instead of the new ECMAScript
// one is actually inteded and prevents weird behaviour if we are trying to
// import this module in another module using Babel.
module.exports = moduleExport;
