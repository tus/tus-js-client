/* global window */
import BaseUpload from "../upload";
import NoopUrlStorage from "../noopUrlStorage";

import { FileStorage, canStoreURLs } from "./urlStorage";
import HttpStack from "./httpStack";
import FileReader from "./fileReader";
import fingerprint from "./fingerprint";

const {defaultOptions} = BaseUpload;

class Upload extends BaseUpload {
  constructor(file = null, options = {}) {
    // TODO: Unify factory APIs
    options.httpStack   = options.httpStack || new HttpStack();
    options.fingerprint = options.fingerprint || fingerprint;
    options.urlStorage  = options.urlStorage || new NoopUrlStorage();
    options.fileReader  = options.fileReader || new FileReader();

    super(file, options);
  }

  static terminate(url, options, cb) {
    options.httpStack   = options.httpStack || new HttpStack();
    options.fingerprint = options.fingerprint || fingerprint;
    options.urlStorage  = options.urlStorage || new NoopUrlStorage();
    options.fileReader  = options.fileReader || new FileReader();

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
  // Make FileStorage module available as it will not be set by default.
  FileStorage,
  canStoreURLs
};
