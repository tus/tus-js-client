'use strict'

beforeEach(() => {
  // Clear localStorage before every test to prevent stored URLs to
  // interfere with our setup.
  localStorage.clear()
})

require('./test-common.cjs')
require('./test-browser-specific.cjs')
require('./test-parallel-uploads.cjs')
require('./test-terminate.cjs')
require('./test-end-to-end.cjs')
