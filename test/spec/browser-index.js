'use strict'

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
