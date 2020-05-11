// The regenerator runtime is needed since the test use functions
// with the async/await keywords. See
// https://babeljs.io/docs/en/babel-plugin-transform-regenerator
import "regenerator-runtime/runtime";
// Polyfill `Promise` for Internet Explorer.
import "es6-promise/auto";

// This is a fun piece of code. Let me tell you the story behind it:
// Internet Explorer 10 and 11 have a bug where the event handlers
// for XMLHttpRequests will be invoked with a significant delay after
// the actual request has been finished. So, even if the HTTP request
// only took 1s to complete, IE will wait another 20s before it decides
// to tell your application that the request has been finished. This
// was not a big problem in daily use since this issue did only occur
// when the user did not interact with the webpage, e.g. move the mouse.
// However, when testing in automated browssers, no user interaction was
// occurring.
// Eventually, someone figured out that this was related to a Promise
// polyfill that is used by the axios HTTP client. This solution is
// to use a timeout, as follows, which is enough to cause the network
// delays to vanish.
// Whoever found that patch, I hope they will go to heaven.
// See https://github.com/axios/axios/issues/1862
function t() {
  window.setTimeout(t, 10);
}
t();

beforeEach(function () {
  // Clear localStorage before every test to prevent stored URLs to
  // interfere with our setup.
  localStorage.clear();
});

require("./helpers/puppeteer/reporter.js");
require("./test-common.js");
require("./test-browser-specific.js");
require("./test-parallel-uploads.js");
require("./test-terminate.js");
require("./test-end-to-end.js");
