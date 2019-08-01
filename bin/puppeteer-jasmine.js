/* eslint no-console: 0 */

/**
 * This script will open the tests' SpecRunner.html to allow the tests to be
 * executed, forward all of the results to the stdout and will finally exit
 * according to the result.
 */

const puppeteer = require("puppeteer");
const path = require("path");

// Enable this flag to not run Puppeteer in headless mode.
const DEBUG = false;

// File-URL pointing to the SpecRunner.html file
const testURL = "file://" + path.join(__dirname, "..", "test", "SpecRunner.html");

async function closeBrowser(browser) {
  if (DEBUG) return;
  await browser.close();
}

(async () => {
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    headless: !DEBUG
  });

  // Stop if the tests didn't complete after one minute.
  const closeTimeout = setTimeout(async () => {
    console.log("Puppeteer tests timed out after 60s");
    process.exitCode = 2;
    await closeBrowser(browser);
  }, 60 * 1000);

  // Forward all messages from the console to stdout.
  // The SpecRunner.html contains a reporter which writes the test results
  // to the console, so we can forward them to stdout.
  const page = await browser.newPage();
  page.on("console", consoleObj => console.log(consoleObj.text()));

  // The reporter in test/spec/helpers/puppeteer/reporter.js will call the
  // __jasmineCallback function once all tests have been completed.
  // The passed argument is a boolean indicating the test result.
  await page.exposeFunction("__jasmineCallback", async (passed) => {
    process.exitCode = passed ? 0 : 1;
    clearTimeout(closeTimeout);
    await closeBrowser(browser);
  });

  await page.goto(testURL);
})();
