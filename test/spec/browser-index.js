// The regenerator runtime is needed since the test use functions
// with the async/await keywords. See
// https://babeljs.io/docs/en/babel-plugin-transform-regenerator
import 'regenerator-runtime/runtime'

import './test-common'
import './test-browser-specific'
import './test-parallel-uploads'
import './test-terminate'
import './test-end-to-end'

beforeEach(() => {
  // Clear localStorage before every test to prevent stored URLs to
  // interfere with our setup.
  localStorage.clear()
})
