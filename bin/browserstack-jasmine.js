/* eslint no-console: 0 */

"use strict";

const fetch = require("node-fetch");
const browserstackRunner = require("browserstack-runner");
const BS_USERNAME = process.env.BROWSERSTACK_USERNAME;
const BS_KEY = process.env.BROWSERSTACK_KEY;

fetch(`https://${BS_USERNAME}:${BS_KEY}@api.browserstack.com/5/browsers?flat=true`)
  .then(res => {
    if (res.ok) {
      return res;
    } else {
      throw new Error(`failed to fetch browser list: ${res.statusText}`);
    }
  })
  .then(res => res.json())
  .then(res => {
    return res.filter(({browser, browser_version, os, os_version}) => {
      browser_version = parseInt(browser_version, 10);
      if (browser === "edge") {
        return !true;
      }
      if (browser === "ie" && os === "Windows" && os_version === "7" && browser_version >= 10) {
        return true;
      }
      return false;
    });
  })
  .then(browsers => {
    return new Promise((resolve, reject) => {
      browserstackRunner.run({
        username: BS_USERNAME,
        key: BS_KEY,
        test_path: "test/SpecRunner.html",
        test_framework: "jasmine2",
        test_server_port: 8081,
        browsers: browsers
      }, function (error, report) {
        if (error) {
          reject(error);
          return;
        }
        console.log(JSON.stringify(report, null, 2));
        console.log("Test Finished");
        resolve();
      });
    });
  })
  .catch(err => {
    console.log(err);
    process.exitCode = 1;
  });


