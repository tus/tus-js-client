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
  expect(testStack._pendingRequests.length).withContext(`request after ${delay} ms`).toBe(1)
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
  describe('retry delays', () => {
    beforeEach(() => {
      jasmine.clock().install()
      jasmine.clock().mockDate(new Date('2026-01-01T00:00:00Z'))
    })

    afterEach(() => {
      jasmine.clock().uninstall()
    })

    it('should keep retrying for about a minute with the default retryDelays', async () => {
      const options = {
        onSuccess: waitableFunction('onSuccess'),
        onError: waitableFunction('onError'),
      }
      const testStack = startUpload(options)

      let req = await testStack.nextRequest()
      for (const delay of [0, 1000, 3000, 5000, 10000, 20000, 30000]) {
        respondToCreation(req, { status: 502 })
        req = await expectRequestAfter(testStack, delay)
      }
      respondToCreation(req, { status: 201, responseHeaders: { Location: '/files/foo' } })

      req = await testStack.nextRequest()
      expect(req.method).toBe('PATCH')
      req.respondWith({ status: 204, responseHeaders: { 'Upload-Offset': '11' } })

      await options.onSuccess.toBeCalled()
      expect(options.onError).not.toHaveBeenCalled()
    })

    it('should emit an error once the default retryDelays are used up', async () => {
      const options = { onError: waitableFunction('onError') }
      const testStack = startUpload(options)

      let req = await testStack.nextRequest()
      for (const delay of [0, 1000, 3000, 5000, 10000, 20000, 30000]) {
        respondToCreation(req, { status: 502 })
        req = await expectRequestAfter(testStack, delay)
      }
      respondToCreation(req, { status: 502 })

      await options.onError.toBeCalled()
      expect(options.onError).toHaveBeenCalledTimes(1)
    })

    it('should use custom retryDelays as given', async () => {
      const options = { retryDelays: [5, 15], onError: waitableFunction('onError') }
      const testStack = startUpload(options)

      let req = await testStack.nextRequest()
      respondToCreation(req, { status: 500 })
      req = await expectRequestAfter(testStack, 5)
      respondToCreation(req, { status: 500 })
      req = await expectRequestAfter(testStack, 15)
      respondToCreation(req, { status: 500 })

      await options.onError.toBeCalled()
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

    it('should accept every HTTP date format in Retry-After', async () => {
      const options = { retryDelays: [10, 10, 10], onError: waitableFunction('onError') }
      const testStack = startUpload(options)

      // The mocked clock stands at 2026-01-01T00:00:00Z.
      let req = await testStack.nextRequest()
      respondToCreation(req, {
        status: 503,
        responseHeaders: { 'Retry-After': 'Thu, 01 Jan 2026 00:00:03 GMT' },
      })
      req = await expectRequestAfter(testStack, 3000)

      respondToCreation(req, {
        status: 503,
        responseHeaders: { 'Retry-After': 'Thursday, 01-Jan-26 00:00:07 GMT' },
      })
      req = await expectRequestAfter(testStack, 4000)

      // asctime has no zone marker, but HTTP dates are always UTC.
      respondToCreation(req, {
        status: 503,
        responseHeaders: { 'Retry-After': 'Thu Jan  1 00:00:12 2026' },
      })
      req = await expectRequestAfter(testStack, 5000)

      respondToCreation(req, { status: 503 })
      await options.onError.toBeCalled()
    })

    it('should ignore an invalid Retry-After header', async () => {
      const options = { retryDelays: [10, 10, 10], onError: waitableFunction('onError') }
      const testStack = startUpload(options)

      let req = await testStack.nextRequest()
      respondToCreation(req, { status: 503, responseHeaders: { 'Retry-After': 'soon' } })
      req = await expectRequestAfter(testStack, 10)

      respondToCreation(req, { status: 503, responseHeaders: { 'Retry-After': '-40' } })
      req = await expectRequestAfter(testStack, 10)

      respondToCreation(req, {
        status: 503,
        responseHeaders: { 'Retry-After': 'Sat, 31 Feb 2026 00:00:00 GMT' },
      })
      req = await expectRequestAfter(testStack, 10)

      respondToCreation(req, { status: 503 })
      await options.onError.toBeCalled()
    })

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
