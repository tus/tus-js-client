/* eslint no-console: 0 */

"use strict";

const browserstack = require("browserstack-runner");
const BS_USERNAME = process.env.BROWSERSTACK_USERNAME;
const BS_KEY = process.env.BROWSERSTACK_KEY;

const browsers = [
  "ie_10",
  "ie_11",

  "edge_previous",
  "edge_current",

  "chrome_previous",
  "chrome_current",

  "firefox_previous",
  "firefox_current",

  "safari_previous",
  "safari_current",

  "opera_previous",
  "opera_current"
];

function runTests(cb) {
  browserstack.run({
    username: BS_USERNAME,
    key: BS_KEY,
    test_path: "test/SpecRunner.html",
    test_framework: "jasmine2",
    test_server_port: 8081,
    browsers: browsers
  }, function (err, report) {
    if (err) {
      return cb(err);
    }

    console.log(JSON.stringify(report, null, 2));
    console.log("Test Finished");
    cb();
  });
}

runTests((err) => {
  if (err) {
    console.log(err);
    process.exitCode = 1;
  }
});
