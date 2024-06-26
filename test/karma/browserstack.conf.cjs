// Karma configuration for testing using BrowserStack
const baseConfig = require('./base.conf.cjs')

// Pass ID from Github Actions to BrowserStack, so that individual
// runs are grouped together.
// See https://github.com/karma-runner/karma-browserstack-launcher#cicd-build-environment-variables
if ('GITHUB_RUN_ID' in process.env) {
  process.env.BUILD_NUMBER = process.env.GITHUB_RUN_ID
}

module.exports = (config) => {
  baseConfig(config)
  config.set({
    // global config of your BrowserStack account
    browserStack: {
      username: process.env.BROWSERSTACK_USERNAME,
      accessKey: process.env.BROWSERSTACK_KEY,
    },

    // define browsers
    customLaunchers: {
      // Firefox
      bs_firefox: {
        base: 'BrowserStack',
        browser: 'firefox',
        browser_version: 'latest',
        os: 'Windows',
        os_version: '10',
      },
      // Chrome
      bs_chrome: {
        base: 'BrowserStack',
        browser: 'chrome',
        browser_version: 'latest',
        os: 'Windows',
        os_version: '10',
      },
      // Edge
      bs_edge: {
        base: 'BrowserStack',
        browser: 'edge',
        browser_version: 'latest',
        os: 'Windows',
        os_version: '10',
      },
      // Safari
      bs_safari: {
        base: 'BrowserStack',
        browser: 'safari',
        browser_version: 'latest',
        os: 'OS X',
        os_version: 'Monterey',
      },
      // iOS
      bs_ios: {
        base: 'BrowserStack',
        browser: 'safari',
        os: 'ios',
        os_version: '15',
        device: 'iPhone 13 Mini',
        real_mobile: 'true',
      },
      // Android
      bs_android: {
        base: 'BrowserStack',
        browser: 'chrome',
        os: 'android',
        os_version: '12.0',
        device: 'Google Pixel 6',
        real_mobile: 'true',
      },
    },

    browsers: ['bs_firefox', 'bs_chrome', 'bs_edge', 'bs_safari', 'bs_ios', 'bs_android'],

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://www.npmjs.com/search?q=keywords:karma-reporter
    reporters: ['progress', 'BrowserStack'],

    // Concurrency level
    // how many browser instances should be started simultaneously
    concurrency: 2,
  })
}
