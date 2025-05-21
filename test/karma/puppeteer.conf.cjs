// Karma configuration for testing using Puppeteer
const baseConfig = require('./base.conf.cjs')

// Configure to use Puppeteer. See https://github.com/karma-runner/karma-chrome-launcher#available-browsers
process.env.CHROME_BIN = require('puppeteer').executablePath()

module.exports = (config) => {
  baseConfig(config)
  config.set({
    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://www.npmjs.com/search?q=keywords:karma-reporter
    reporters: ['progress'],

    // start these browsers
    // available browser launchers: https://www.npmjs.com/search?q=keywords:karma-launcher
    browsers: ['ChromeHeadless'],
  })
}
