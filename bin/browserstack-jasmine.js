/* eslint no-console: 0 */

"use strict";

const browserstack = require("browserstack-runner");
const BS_USERNAME = process.env.BROWSERSTACK_USERNAME;
const BS_KEY = process.env.BROWSERSTACK_KEY;

// A list of available browsers is available at:
// https://www.browserstack.com/list-of-browsers-and-platforms/js_testing
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
    "os_version": "12.1",
    "device": "iPhone XS",
    "realMobile": true
  },
  {
    "os": "ios",
    "os_version": "11.0",
    "device": "iPhone X",
    "realMobile": true
  },
  {
    "os": "ios",
    "os_version": "10.3",
    "device": "iPhone 7",
    "realMobile": true
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
  }, function (err, reports) {
    if (err) {
      return cb(err);
    }

    // Enable to see full report
    // console.log(JSON.stringify(reports, null, 2));
    console.log("Test Finished");
    console.log("");

    reports.forEach((report) => {
      const testCount = report.suites.testCounts.total;

      if (testCount === 0) {
        console.log(`✘ ${report.browser}: No tests ran, which is considered a failure`);
        process.exitCode = 1;
        return;
      }

      if (report.suites.status !== "passed") {
        console.log(`✘ ${report.browser}: Test suite failed`);
        process.exitCode = 1;
        return;
      }

      console.log(`✓ ${report.browser}: Test suite passed`);
    });

    if (reports.length != browsers.length) {
      console.log(`✘ Only received ${reports.length} reports but expected ${browsers.length}!`);
      process.exitCode = 1;
    }

    cb();
  });
}

runTests((err) => {
  if (err) {
    console.log(err);
    process.exitCode = 1;
  }
});
