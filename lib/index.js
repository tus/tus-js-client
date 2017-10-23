/* global window */
import Upload from "./upload";
import {canStoreURLs} from "./node/storage";

const {defaultOptions} = Upload;

if (typeof window !== "undefined") {
  // Browser environment using XMLHttpRequest
  const {XMLHttpRequest, Blob} = window;

  var isSupported = (
    XMLHttpRequest &&
    Blob &&
    typeof Blob.prototype.slice === "function"
  );
} else {
  // Node.js environment using http module
  var isSupported = true;
}

// The usage of the commonjs exporting syntax instead of the new ECMAScript
// one is actually inteded and prevents weird behaviour if we are trying to
// import this module in another module using Babel.
export default {
  Upload,
  isSupported,
  canStoreURLs,
  defaultOptions
};
