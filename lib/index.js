/* global window */
import Upload from "./upload";

const {defaultOptions} = Upload;
const {XMLHttpRequest, localStorage, Blob} = window;

const isSupported = (
  XMLHttpRequest &&
  localStorage &&
  Blob &&
  typeof Blob.prototype.slice === "function"
);

// The usage of the commonjs exporting syntax instead of the new ECMAScript
// one is actually inteded and prevents weird behaviour if we are trying to
// import this module in another module using Babel.
module.exports = {
  Upload,
  isSupported,
  defaultOptions
};
