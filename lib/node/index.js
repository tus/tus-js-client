/* global window */
import BaseUpload from "../upload";
import NoopUrlStorage from "../noopUrlStorage";
import { enableDebugLog } from "../logger";

import { FileUrlStorage, canStoreURLs } from "./urlStorage";
import HttpStack from "./httpStack";
import FileReader from "./fileReader";
import fingerprint from "./fingerprint";

const defaultOptions = {
  ...BaseUpload.defaultOptions,
  httpStack: new HttpStack(),
  fileReader: new FileReader(),
  urlStorage: new NoopUrlStorage(),
  fingerprint: fingerprint
};

class Upload extends BaseUpload {
  constructor(file = null, options = {}) {
    options = { ...defaultOptions, ...options };
    super(file, options);
  }

  static terminate(url, options, cb) {
    options = { ...defaultOptions, ...options };
    return BaseUpload.terminate(url, options, cb);
  }
}

// The Node.js environment does not have restrictions which may cause
// tus-js-client not to function.
const isSupported = true;

// The usage of the commonjs exporting syntax instead of the new ECMAScript
// one is actually inteded and prevents weird behaviour if we are trying to
// import this module in another module using Babel.
export {
  Upload,
  defaultOptions,
  isSupported,
  // Make FileUrlStorage module available as it will not be set by default.
  FileUrlStorage,
  canStoreURLs,
  enableDebugLog,
  HttpStack
};
