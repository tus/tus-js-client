// End-to-end uploads target TUS_ENDPOINT when it is set. Node and Deno read the
// environment directly. Karma copies it onto __karma__.config because the browser
// bundle is built before the test run. SpecRunner.html can pass ?endpoint=.
// Otherwise the public demo is used, except in CI, where a missing value is an
// error so a forgotten workflow variable cannot silently hit the demo.

const DEMO_ENDPOINT = 'https://tusd.tusdemo.net/files/'

function nonempty(value) {
  if (typeof value !== 'string') return ''
  return value.trim()
}

function queryEndpoint() {
  const search = globalThis.location?.search
  if (!search) return ''
  return new URLSearchParams(search).get('endpoint') || ''
}

/**
 * Upload creation URL for end-to-end tests, with a trailing slash.
 * @returns {string}
 */
export function getTusEndpoint() {
  const karmaConfig = globalThis.__karma__?.config
  const configured =
    nonempty(globalThis.process?.env?.TUS_ENDPOINT) ||
    nonempty(karmaConfig?.tusEndpoint) ||
    nonempty(queryEndpoint())

  if (!configured) {
    const ci = globalThis.process?.env?.CI === 'true' || Boolean(karmaConfig?.requireTusEndpoint)
    if (ci) {
      throw new Error('TUS_ENDPOINT is required when CI is set')
    }
    return DEMO_ENDPOINT
  }

  return configured.endsWith('/') ? configured : `${configured}/`
}
