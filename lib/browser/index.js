/* global window */
import BaseUpload from "../upload";
import NoopUrlStorage from "../noopUrlStorage";

import { canStoreURLs, WebStorageUrlStorage } from "./urlStorage";
import HttpStack from "./httpStack";
import FileReader from "./fileReader";
import fingerprint from "./fingerprint";

const {defaultOptions} = BaseUpload;

class Upload extends BaseUpload {
  constructor(file = null, options = {}) {
    // TODO: Unify factory APIs
    // TODO: Do not recreate them for every upload
    options.httpStack   = options.httpStack || new HttpStack();
    options.fingerprint = options.fingerprint || fingerprint;
    options.urlStorage  = options.urlStorage || (canStoreURLs ? new WebStorageUrlStorage() : new NoopUrlStorage());
    options.fileReader  = options.fileReader || new FileReader();

    super(file, options);
  }

  static terminate(url, options, cb) {
    options.httpStack   = options.httpStack || new HttpStack();
    options.fingerprint = options.fingerprint || fingerprint;
    options.urlStorage  = options.urlStorage || (canStoreURLs ? new WebStorageUrlStorage() : new NoopUrlStorage());
    options.fileReader  = options.fileReader || new FileReader();

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
