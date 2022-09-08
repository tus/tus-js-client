'use strict'

// The regenerator runtime is needed since the test use functions
// with the async/await keywords. See
// https://babeljs.io/docs/en/babel-plugin-transform-regenerator
require('regenerator-runtime/runtime')

beforeEach(() => {
  // Clear localStorage before every test to prevent stored URLs to
  // interfere with our setup.
  localStorage.clear()
})

require('./test-common')
require('./test-browser-specific')
require('./test-parallel-uploads')
require('./test-terminate')
require('./test-end-to-end')
