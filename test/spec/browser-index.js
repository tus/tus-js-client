import "regenerator-runtime/runtime";
//import "core-js/modules/es.promise";
//import "core-js/stable";

// https://github.com/axios/axios/issues/1862
function t() {
  window.setTimeout(t, 10);
}
t();

require("./helpers/puppeteer/reporter.js");
require("./upload.js");
require("./upload.browser.js");
