// Karma configuration for testing using BrowserStack
const baseConfig = require('./base.conf')

process.env.BUILD_NUMBER = process.env.GITHUB_RUN_ID

module.exports = (config) => {
  baseConfig(config)
  config.set({

    // global config of your BrowserStack account
    browserStack: {
      username : process.env.BROWSERSTACK_USERNAME,
      accessKey: process.env.BROWSERSTACK_KEY,
    },

    // define browsers
    customLaunchers: {
      bs_firefox_latest: {
        base           : 'BrowserStack',
        browser        : 'firefox',
        browser_version: 'latest',
        os             : 'Windows',
        os_version     : '10',
      },
      bs_firefox_previous: {
        base           : 'BrowserStack',
        browser        : 'firefox',
        browser_version: 'latest-1',
        os             : 'Windows',
        os_version     : '10',
      },
    },

    browsers: ['bs_firefox_latest', 'bs_firefox_previous'],

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://www.npmjs.com/search?q=keywords:karma-reporter
    reporters: ['progress', 'BrowserStack'],

  })
}
