/* global window */
import BaseUpload from "../upload";

import { canStoreURLs, getStorage } from "./storage";
import HttpStack from "./request";
import fingerprint from "./fingerprint";
import { getSource } from "./source";

const {defaultOptions} = BaseUpload;

class Upload extends BaseUpload {
  constructor(file = null, options = {}) {
    // TODO: Unify factory APIs
    options.httpStack   = options.httpStack || new HttpStack();
    options.fingerprint = options.fingerprint || fingerprint;
    options.urlStorage  = options.urlStorage || getStorage();
    options.fileReader  = options.fileReader || getSource;

    super(file, options);
  }

  static terminate(url, options, cb) {
    options.httpStack   = options.httpStack || new HttpStack();
    options.fingerprint = options.fingerprint || fingerprint;
    options.urlStorage  = options.urlStorage || getStorage();
    options.fileReader  = options.fileReader || getSource;

    return BaseUpload.terminate(url, options, cb);
  }
}

const {XMLHttpRequest, Blob} = window;

const isSupported = (
  XMLHttpRequest &&
  Blob &&
  typeof Blob.prototype.slice === "function"
);

export {
  Upload,
  canStoreURLs,
  defaultOptions,
  isSupported
};
