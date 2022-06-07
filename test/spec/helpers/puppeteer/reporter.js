/* eslint no-console: 0 */
/* eslint no-unused-vars: 0 */

let testsCompleted = false
let testsPassed = true

// This reporter is used by bin/puppeteer-jasmine.js to obtain the test results.
// See https://jasmine.github.io/api/edge/Reporter.html for more details on the
// function signatures.
const reporter = {
  jasmineStarted (suiteInfo) { },
  suiteStarted (result) { },
  specStarted (result) { },
  specDone (result) {
    // Print the test result to the console.
    const passed = result.status === 'passed'
    const prefix = passed ? '✓' : '✘'
    console.log(prefix, result.fullName)

    testsCompleted = true
    testsPassed = testsPassed && passed

    for (let i = 0; i < result.failedExpectations.length; i++) {
      console.log(`Failure: ${result.failedExpectations[i].message}`)
      console.log(result.failedExpectations[i].stack)
      console.log('')
    }
  },
  suiteDone (result) { },
  jasmineDone (result) {
    const success = testsCompleted && testsPassed

    if (success) {
      console.log('Tests passed!')
    } else {
      console.log('Tests failed!')
    }

    // The __jasmineCallback function is exposed by the bin/puppeteer-jasmine.js
    // script. See it for more details.
    if (typeof window.__jasmineCallback === 'function') {
      window.__jasmineCallback(success)
    }
  },
}

window.jasmine.getEnv().addReporter(reporter)
