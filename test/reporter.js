/**
 * Reporter is a Jasmine Reporter which stored information about the test
 * results and makes them available in the window_global_test_results
 * property where SauceLabs and the bin/sauce-jasmine.js script can pick them
 * up.
 *
 * For details on the Jasmine Reporter interface, see:
 * https://jasmine.github.io/api/edge/Reporter.html
 *
 * For details on the SauceLabs result object, see:
 * https://wiki.saucelabs.com/display/DOCS/Reporting+JavaScript+Unit+Test+Results+to+Sauce+Labs+Using+a+Custom+Framework
 */
function Reporter() {
  this._results = {
    passed: 0,
    failed: 0,
    total: 0,
    duration: 0,
    tests: []
  };

  this._startTime = Date.now();
}

Reporter.prototype.jasmineDone = function () {
  var startTime = this._startTime;
  var endTime = Date.now();
  this._results.duration = (endTime - startTime) / 1000;

  window.global_test_results = this._results;
};

Reporter.prototype.specDone = function (result) {
  this._results.total += 1;

  // We only add details of failing tests to the result to avoid making the
  // result object to big. SauceLabs is know to drop the results object if it's
  // size gets too big, see: https://github.com/axemclion/grunt-saucelabs/issues/138
  if (result.status === "passed") {
    this._results.passed += 1;
  } else {
    this._results.failed += 1;
    this._results.tests.push({
      name: result.fullName,
      result: false
    });
  }
};

jasmine.getEnv().addReporter(new Reporter());
