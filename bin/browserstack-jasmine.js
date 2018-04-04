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
  "opera_current",

  {
    "os": "ios",
    "os_version": "11.0",
    "device": "iPhone X"
  },
  {
    "os": "ios",
    "os_version": "10",
    "device": "iPhone 7"
  },
  {
    "os": "ios",
    "os_version": "9",
    "device": "iPhone 6S"
  },
  {
    "os": "ios",
    "os_version": "8",
    "device": "iPhone 6"
  },
  {
    "os": "ios",
    "os_version": "7",
    "device": "iPhone 5S"
  },
  {
    "os": "ios",
    "os_version": "6.0",
    "device": "iPhone 5"
  }
];

if (!BS_USERNAME || BS_USERNAME == "" || !BS_KEY || BS_KEY == "") {
  console.log("Please provide the BROWSERSTACK_USERNAME and BROWSERSTACK_KEY environment variables.");
  process.exit(1);
}

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
