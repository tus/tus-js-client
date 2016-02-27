"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

/* global window */

var Upload = _interopRequire(require("./upload"));

var defaultOptions = Upload.defaultOptions;
var XMLHttpRequest = window.XMLHttpRequest;
var localStorage = window.localStorage;
var Blob = window.Blob;

var isSupported = XMLHttpRequest && localStorage && Blob && typeof Blob.prototype.slice === "function";

// The usage of the commonjs exporting syntax instead of the new ECMAScript
// one is actually inteded and prevents weird behaviour if we are trying to
// import this module in another module using Babel.
module.exports = {
  Upload: Upload,
  isSupported: isSupported,
  defaultOptions: defaultOptions
};