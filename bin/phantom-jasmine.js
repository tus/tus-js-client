/* global ConsoleReporter */
/* eslint no-console: 0 */
/* eslint-env phantomjs */

/**
 * This script will open the tests' SpecRunner.html to allow the tests to be
 * executed, forward all of the results to the stdout and will finally exit
 * according to the result.
 *
 * In order to run this script, invoke it using following command:
 * phantomjs --local-to-remote-url-access=yes bin/phantom-jasmine.js
 *
 * The --local-to-remote-url-access flag is required as else Phantom
 * will complain about NETWORK_ERR XMLHttpRequest Exception 101.
 * This is caused by us opening test/SpecRunner.html using the file://
 * protocol but in test/spec/upload.browser.js we make HTTP requests
 * to https://master.tus.io/ which is usually not allowed. Therfore,
 * we must explicitly disable to (elsewhere useful) security rule.
 */
"use strict";

var page = require("webpage").create();
var fs = require("fs");
var sys = require("system");

// Calculate the absolute path to the current script, regardless of the working
// directory, e.g. /home/user/tus-js-client/bin/
var __dirname = phantom.libraryPath + fs.separator;

// Embed the ConsoleReporter in a simple function to emulate the CommonJS
// module environment.
var prelude = "window.ConsoleReporter = {};(function(module, exports){";
var postlude = "})(ConsoleReporter);ConsoleReporter=ConsoleReporter.exports;";
var reporterScript = prelude + fs.read(__dirname + "../node_modules/jasmine/lib/reporters/console_reporter.js") + postlude;

var jasmineFound = false;

// Tests whether the global jasmine object is available yet and if so, inject
// the source for the ConsoleReporter.
function checkJasmineStatus() {
  // Only inject the source once.
  if (jasmineFound) {
    return;
  }

  var found = page.evaluate(function () {
    return "jasmine" in window && jasmine.getEnv;
  });

  if (!found) {
    return;
  }

  jasmineFound = true;

  injectReporter();
}

// Inject the ConsoleReporter's source into the browser context and register
// an instance as a reporter.
function injectReporter() {
  page.evaluate(function (script) {
    function print(msg) {
      console.log(msg);
    }

    function onComplete(passed) {
      window.callPhantom(passed);
    }

    eval(script);

    var reporter = new ConsoleReporter();
    reporter.setOptions({
      print: print,
      printDeprecation: print,
      showColors: true,
      onComplete: onComplete
    });

    jasmine.getEnv().addReporter(reporter);
  }, reporterScript);
}

// Forward console messages from the browser to stdout without adding line endings.
page.onConsoleMessage = function (msg) {
  sys.stdout.write(msg);
};

// Log errors which occur while loading resources for the ease of debugging.
page.onResourceError = function (resourceError) {
  console.log("Unable to load resource (#" + resourceError.id + "URL:" + resourceError.url + ")");
  console.log("Error code: " + resourceError.errorCode + ". Description: " + resourceError.errorString);
};

// Test after every resource whether the global jasmine object is available.
page.onResourceReceived = checkJasmineStatus;

page.onCallback = function (passed) {
  phantom.exit(passed ? 0 : 1);
};

page.open("./test/SpecRunner.html", function (status) {
  if (status !== "success") {
    console.log("Network error.");
  }
});
