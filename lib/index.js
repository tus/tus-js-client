/* global window */
import BaseUpload from "./upload";

// We import the files used inside the Node environment which are rewritten
// for browsers using the rules defined in the package.json
import * as storage from "./node/storage";
import HttpStack from "./node/request";
import fingerprint from "./node/fingerprint";
import { getSource } from "./node/source";

const {defaultOptions} = BaseUpload;

class Upload extends BaseUpload {
  constructor(file = null, options = {}) {
    // TODO: Unify factory APIs
    options.httpStack   = options.httpStack || new HttpStack();
    options.fingerprint = options.fingerprint || fingerprint;
    options.urlStorage  = options.urlStorage || storage.getStorage();
    options.fileReader  = options.fileReader || getSource;

    super(file, options);
  }

  static terminate(url, options, cb) {
    options.httpStack   = options.httpStack || new HttpStack();
    options.fingerprint = options.fingerprint || fingerprint;
    options.urlStorage  = options.urlStorage || storage.getStorage();
    options.fileReader  = options.fileReader || getSource;

    return BaseUpload.terminate(url, options, cb);
  }
}

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
