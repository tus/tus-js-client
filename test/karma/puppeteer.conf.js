// Karma configuration for testing using Puppeteer
import baseConfig from './base.conf'

// Configure to use Puppeteer. See https://github.com/karma-runner/karma-chrome-launcher#available-browsers
process.env.CHROME_BIN = require('puppeteer').executablePath()

export default (config) => {
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
