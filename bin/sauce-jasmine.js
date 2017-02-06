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

var browserFilter = [
  "internet explorer/9..latest",
  "microsoftedge/13..latest",
  "firefox/31..latest/linux",
  "chrome/31..latest/linux",
  "safari/5..latest",
  "opera/11..latest",
  "android/4.4..latest",
  "iphone/5.1..latest"
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
    name: "tus-js-client – Jasmine"
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
    var tests = res["js tests"];
    var remainingTestIds = [];

    tests.forEach(function (test) {
      if (test.status === "test error") {
        console.log("Browser %s errored!".red, test.platform.join(" "));
        failedTests++;
        return;
      }

      if (!("result" in test)) {
        // No results are available yet, so we still need to wait for it.
        remainingTestIds.push(test.id);
        return;
      }

      if (test.result == null) {
        console.log("Browser %s completed without success!".red, test.platform.join(" "));
        failedTests++;
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
