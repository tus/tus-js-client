import { Upload } from 'tus-js-client'
import { getBlob, TestHttpStack, waitableFunction } from './helpers/utils.js'

// Captured before jasmine.clock() replaces it, so pending promise chains can settle while the
// mocked clock stands still.
const realSetTimeout = globalThis.setTimeout

function settle() {
  return new Promise((resolve) => realSetTimeout(resolve, 0))
}

async function waitForPendingRequest(testStack) {
  for (let i = 0; i < 20 && testStack._pendingRequests.length === 0; i++) {
    await settle()
  }
}

// Advances the mocked clock and checks that the client sends its next request exactly after
// `delay` milliseconds, not earlier.
async function expectRequestAfter(testStack, delay) {
  await settle()
  if (delay > 0) {
    jasmine.clock().tick(delay - 1)
    await settle()
    await settle()
    expect(testStack._pendingRequests.length).withContext(`request before ${delay} ms`).toBe(0)
  }
  jasmine.clock().tick(delay > 0 ? 1 : 0)
  await waitForPendingRequest(testStack)
  if (testStack._pendingRequests.length !== 1) {
    throw new Error(`Expected one retry request after ${delay} ms`)
  }
  return testStack.nextRequest()
}

function respondToCreation(req, response) {
  expect(req.url).toBe('http://tus.io/files/')
  expect(req.method).toBe('POST')
  req.respondWith(response)
}

function startUpload(options) {
  const testStack = new TestHttpStack()
  const upload = new Upload(getBlob('hello world'), {
    httpStack: testStack,
    endpoint: 'http://tus.io/files/',
    ...options,
  })
  upload.start()
  return testStack
}

describe('tus', () => {
  describe('Retry-After', () => {
    beforeEach(() => {
      jasmine.clock().install()
      jasmine.clock().mockDate(new Date('2026-01-01T00:00:00Z'))
    })

    afterEach(() => {
      jasmine.clock().uninstall()
    })

    it('should wait at least as long as the Retry-After header asks', async () => {
      const options = { retryDelays: [10, 10, 10, 10], onError: waitableFunction('onError') }
      const testStack = startUpload(options)

      let req = await testStack.nextRequest()
      respondToCreation(req, { status: 503, responseHeaders: { 'Retry-After': '2' } })
      req = await expectRequestAfter(testStack, 2000)

      const inFiveSeconds = new Date(Date.now() + 5000).toUTCString()
      respondToCreation(req, { status: 503, responseHeaders: { 'Retry-After': inFiveSeconds } })
      req = await expectRequestAfter(testStack, 5000)

      // A shorter request than the schedule keeps the scheduled delay.
      respondToCreation(req, { status: 503, responseHeaders: { 'Retry-After': '0' } })
      req = await expectRequestAfter(testStack, 10)

      // A long request is capped.
      respondToCreation(req, { status: 503, responseHeaders: { 'Retry-After': '3600' } })
      req = await expectRequestAfter(testStack, 60000)

      respondToCreation(req, { status: 503 })
      await options.onError.toBeCalled()
    })

    async function expectRetryAfter(header, delay) {
      const options = { retryDelays: [10], onError: waitableFunction('onError') }
      const testStack = startUpload(options)

      let req = await testStack.nextRequest()
      respondToCreation(req, { status: 503, responseHeaders: { 'Retry-After': header } })
      req = await expectRequestAfter(testStack, delay)

      respondToCreation(req, { status: 503 })
      await options.onError.toBeCalled()
    }

    it('should read an asctime Retry-After date as UTC', async () => {
      await expectRetryAfter('Thu Jan  1 00:00:05 2026', 5000)
    })

    it('should read an RFC 850 Retry-After date as UTC', async () => {
      await expectRetryAfter('Thursday, 01-Jan-26 00:00:05 GMT', 5000)
    })

    it('should read an RFC 850 date in the next century when it is within 50 years', async () => {
      jasmine.clock().mockDate(new Date('2099-12-31T23:59:57Z'))
      await expectRetryAfter('Friday, 01-Jan-00 00:00:02 GMT', 5000)
    })

    it('should read an RFC 850 date over 50 years ahead as a past date', async () => {
      // The weekday matches 2076. Using that year would extend the scheduled delay.
      await expectRetryAfter('Thursday, 02-Jan-76 00:00:00 GMT', 10)
    })

    it('should cap an RFC 850 date exactly 50 years ahead', async () => {
      await expectRetryAfter('Wednesday, 01-Jan-76 00:00:00 GMT', 60000)
    })

    it('should reject an RFC 850 date on March 1 beyond the 50-year cutoff from leap day', async () => {
      jasmine.clock().mockDate(new Date('2024-02-29T12:00:00Z'))
      await expectRetryAfter('Thursday, 01-Mar-74 00:00:00 GMT', 10)
    })

    it('should accept an HTTP date during a leap second', async () => {
      jasmine.clock().mockDate(new Date('2016-12-31T23:59:55Z'))
      await expectRetryAfter('Sat, 31 Dec 2016 23:59:60 GMT', 5000)
    })

    it('should cap arbitrarily large delay-seconds', async () => {
      await expectRetryAfter('9'.repeat(400), 60000)
    })

    it('should allow HTTP whitespace around delay-seconds', async () => {
      await expectRetryAfter(' \t2\t ', 2000)
    })

    it('should ignore a past Retry-After date', async () => {
      await expectRetryAfter('Wed, 31 Dec 2025 23:59:59 GMT', 10)
    })

    for (const header of [
      'soon',
      '-40',
      '1.5',
      '\u00a060',
      '2099-01-01',
      'Tue, 31 Feb 2099 00:00:00 GMT',
      'Fri, 01 Jan 2026 00:00:05 GMT',
      'Thu, 01 Jan 2026 00:00:60 GMT',
      'Thu, 01 Jan 2026 23:59:60 GMT',
    ]) {
      it(`should ignore an invalid Retry-After header (${header})`, async () => {
        await expectRetryAfter(header, 10)
      })
    }

    it('should not retry a non-retryable status even if it carries Retry-After', async () => {
      const options = { onError: waitableFunction('onError') }
      const testStack = startUpload(options)

      const req = await testStack.nextRequest()
      respondToCreation(req, { status: 429, responseHeaders: { 'Retry-After': '1' } })

      await options.onError.toBeCalled()
      jasmine.clock().tick(60000)
      await settle()
      expect(testStack._pendingRequests.length).toBe(0)
    })

    it('should honor Retry-After when retrying a termination', async () => {
      const testStack = new TestHttpStack()

      const terminating = Upload.terminate('http://tus.io/files/foo', {
        httpStack: testStack,
        retryDelays: [10],
      })

      let req = await testStack.nextRequest()
      expect(req.method).toBe('DELETE')
      req.respondWith({ status: 503, responseHeaders: { 'Retry-After': '1' } })

      req = await expectRequestAfter(testStack, 1000)
      expect(req.method).toBe('DELETE')
      req.respondWith({ status: 204 })

      await terminating
    })
  })
})
