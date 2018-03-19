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

export default {
  Upload,
  isSupported,
  canStoreURLs,
  defaultOptions
};
