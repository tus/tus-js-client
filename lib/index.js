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

export default {
  Upload,
  isSupported,
  defaultOptions
};
