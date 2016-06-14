/* eslint no-console: 0 */

"use strict";

var colors = require("colors");
var getBrowsers = require("get-saucelabs-browsers");
var http = require("https");
var url = require("url");

var username = process.env.SAUCE_USERNAME;
var accessKey = process.env.SAUCE_ACCESS_KEY;
var tunnelId = process.env.SAUCE_TUNNEL || process.env.TRAVIS_JOB_NUMBER;
var build = process.env.TRAVIS_BUILD_NUMBER || null;
var testUrl = process.argv[2];
if (!username || !accessKey) {
  console.log("Missing username and access key for SauceLabs. Please provide ".red +
              "the %s and %s environment variables.".red,
              "SAUCE_USERNAME".underline,
              "SAUCE_ACCESS_KEY".underline);
  process.exit(1);
}

if (!tunnelId) {
  console.log("Missing tunnel identifier. Please start Sauce Connect and provide ".red +
              "the %s (or %s) environment variable.".red,
              "SAUCE_TUNNEL".underline,
              "TRAVIS_JOB_NUMBER".underline);
  process.exit(1);
}

if (!testUrl) {
  console.log("Missing test URL. Please provide it as the first argument, such as:\n".red +
              "    $ node bin/sauce-jasmine.js %s",
              "http://localhost:9999/test/SpecRunner.html".underline);
  process.exit(1);
}

function handleError(err) {
  if (!err) return;
  console.log("Unexpected error occured:".red);
  console.log.apply(console, arguments);
  process.exit(1);
}

function request(options, callback) {
  var req = http.request(options, function (res) {
    if (res.statusCode !== 200) {
      handleError("Unexpected status code %s when requesting %s",
                  colors.underline(res.statusCode),
                  options.path.underline);
    }

    var body = "";
    res.on("data", function (chunk) {
      body += chunk.toString();
    });

    res.on("end", function () {
      callback(JSON.parse(body));
    });
  });

  req.on("error", handleError);
  req.write(options.body);
  req.end();
}

var browserFilter = [/*
  "internet explorer/9..latest",
  "microsoftedge/13..latest",
  "firefox/31..latest/linux",
  "chrome/31..latest/linux",
  "safari/5..latest",
  "opera/11..latest",
  //"android/4.0..latest"
  "iphone/5.1..latest"*/
  "android/4.0..latest"
];

getBrowsers(browserFilter, function (err, result) {
  handleError(err);

  startBrowsers(result);
});

function startBrowsers(browsers) {
  var sauceBrowsers = formatBrowsers(browsers);

  var body = {
    platforms: sauceBrowsers,
    url: testUrl,
    framework: "jasmine",
    tunnelIdentifier: tunnelId,
    build: build,
    captureHtml: true
  };

  console.log("Requesting %s browser tests…".yellow, sauceBrowsers.length);

  var options = url.parse("https://saucelabs.com/rest/v1/" + username + "/js-tests");
  options.method = "POST";
  options.auth = username + ":" + accessKey;
  options.body = JSON.stringify(body);
  request(options, function (res) {
    var testIds = res["js tests"];
    startedTests = testIds.length;
    console.log("Queued %s browser tests…".yellow, startedTests);

    pollTestStatus(testIds);
  });
}

function formatBrowsers(browsers) {
  return browsers.filter(function (browser) {
    // One entry seems to always be undefined, so we filter it out.
    return browser.browserName !== undefined;
  }).map(function (browser) {
    return [
      browser.platform,
      browser.browserName,
      browser.version
    ];
  });
}

var startedTests = 0;
var failedTests = 0;
var passedTests = 0;
function pollTestStatus(testIds) {
  var body = {
    "js tests": testIds
  };

  var options = url.parse("https://saucelabs.com/rest/v1/" + username + "/js-tests/status");
  options.method = "POST";
  options.auth = username + ":" + accessKey;
  options.body = JSON.stringify(body);
  request(options, function (res) {
    var test = res["js tests"];
    var remainingTestIds = [];

    test.forEach(function (test) {
      if (!("result" in test)) {
        // No results are available yet, so we still need to wait for it.
        remainingTestIds.push(test.id);
        return;
      }

      if (test.result.passed) {
        // Test passed succesfully. No need to worry about it any more.
        console.log("Browser %s passed!".green, test.platform.join(" "));
        passedTests++;
        return;
      }

      console.log("Browser %s failed!".red, test.platform.join(" "));
      failedTests++;
      printFailedSuites(test.result.suites, "");
    });

    if (remainingTestIds.length === 0) {
      console.log("Started: %s Passed: %s Failed: %s".yellow,
                  startedTests,
                  passedTests,
                  failedTests);

      process.exit(failedTests > 0 ? 1 : 0);
    } else {
      console.log("%s browser remaining…".gray, remainingTestIds.length);
    }

    setTimeout(pollTestStatus.bind({}, remainingTestIds), 3000);
  });
}

function printFailedSuites(suites, prefix) {
  // We do not always get a proper result back, e.g. when the browser crashes
  if (!suites) return;

  suites.forEach(function (suite) {
    var pref = prefix + suite.description;

    suite.specs.forEach(function (spec) {
      if (spec.passed) return;

      printFailedSpec(spec, pref);
    });

    printFailedSuites(suite.suites, pref);
  });
}

function printFailedSpec(spec, prefix) {
  console.log("  "+"%s %s:".red.underline, prefix, spec.description);

  spec.failures.forEach(function (failure, index) {
    console.log("  %s) %s", index+1, failure.message.bold);
    console.log("    %s", failure.trace.stack.gray);
  });
}
/*
printFailedSuites([
          {
            "specs": [],
            "duration": 33,
            "passed": false,
            "failedExpectations": [],
            "durationSec": 0.033,
            "description": "tus",
            "suites": [
              {
                "specs": [
                  {
                    "passedCount": 1,
                    "failures": [],
                    "skipped": false,
                    "description": "should throw if no error handler is available",
                    "failedCount": 0,
                    "pendingReason": "",
                    "durationSec": 0.006,
                    "totalCount": 1,
                    "passed": true,
                    "duration": 6
                  },
                  {
                    "passedCount": 17,
                    "failures": [
                      {
                        "type": "expect",
                        "message": "Expected '/uploads' to be '/uplods'.",
                        "expected": "/uplods",
                        "passed": false,
                        "matcherName": "toBe",
                        "trace": {
                          "stack": "Error: Expected '/uploads' to be '/uplods'.\n    at stack (http://localhost:9999/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1577:17)\n    at buildExpectationResult (http://localhost:9999/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1547:14)\n    at Spec.Env.expectationResultFactory (http://localhost:9999/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:638:18)\n    at Spec.addExpectationResult (http://localhost:9999/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:330:34)\n    at Expectation.addExpectationResult (http://localhost:9999/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:588:21)\n    at Expectation.toBe (http://localhost:9999/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1501:12)\n    at Object.<anonymous> (http://localhost:9999/test/spec/upload.js:83:23)\n    at attemptAsync (http://localhost:9999/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1916:24)\n    at QueueRunner.run (http://localhost:9999/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1871:9)\n    at QueueRunner.execute (http://localhost:9999/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1859:10)"
                        }
                      }
                    ],
                    "skipped": false,
                    "description": "should upload a file",
                    "failedCount": 1,
                    "pendingReason": "",
                    "durationSec": 0.016,
                    "totalCount": 18,
                    "passed": false,
                    "duration": 16
                  },
                  {
                    "passedCount": 12,
                    "failures": [],
                    "skipped": false,
                    "description": "should resume an upload",
                    "failedCount": 0,
                    "pendingReason": "",
                    "durationSec": 0.002,
                    "totalCount": 12,
                    "passed": true,
                    "duration": 2
                  },
                  {
                    "passedCount": 9,
                    "failures": [],
                    "skipped": false,
                    "description": "should create an upload if resuming fails",
                    "failedCount": 0,
                    "pendingReason": "",
                    "durationSec": 0.001,
                    "totalCount": 9,
                    "passed": true,
                    "duration": 1
                  },
                  {
                    "passedCount": 21,
                    "failures": [],
                    "skipped": false,
                    "description": "should upload a file in chunks",
                    "failedCount": 0,
                    "pendingReason": "",
                    "durationSec": 0.002,
                    "totalCount": 21,
                    "passed": true,
                    "duration": 2
                  },
                  {
                    "passedCount": 6,
                    "failures": [],
                    "skipped": false,
                    "description": "should add the original request to errors",
                    "failedCount": 0,
                    "pendingReason": "",
                    "durationSec": 0.001,
                    "totalCount": 6,
                    "passed": true,
                    "duration": 1
                  },
                  {
                    "passedCount": 6,
                    "failures": [],
                    "skipped": false,
                    "description": "should not resume a finished upload",
                    "failedCount": 0,
                    "pendingReason": "",
                    "durationSec": 0.001,
                    "totalCount": 6,
                    "passed": true,
                    "duration": 1
                  },
                  {
                    "passedCount": 12,
                    "failures": [],
                    "skipped": false,
                    "description": "should resume an upload from a specified url",
                    "failedCount": 0,
                    "pendingReason": "",
                    "durationSec": 0.001,
                    "totalCount": 12,
                    "passed": true,
                    "duration": 1
                  }
                ],
                "duration": 33,
                "passed": false,
                "failedExpectations": [],
                "durationSec": 0.033,
                "description": "#Upload",
                "suites": [],
                "status": "finished"
              }
            ],
            "status": "finished"
          }
        ]
,"")*/
