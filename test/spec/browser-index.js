beforeEach(() => {
  // Clear localStorage before every test to prevent stored URLs to
  // interfere with our setup.
  localStorage.clear()
})

import './test-common.js'
import './test-browser-specific.js'
import './test-parallel-uploads.js'
import './test-terminate.js'
import './test-end-to-end.js'
