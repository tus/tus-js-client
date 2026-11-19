import { Upload } from 'tus-js-client'
import { getBlob, TestHttpStack, waitableFunction } from './helpers/utils.js'

// Records the delay of every timer the client schedules and runs the timer right away,
// so the tests can check how long the client would wait without actually waiting.
function recordRetryDelays() {
  const delays = []
  const realSetTimeout = globalThis.setTimeout
  spyOn(globalThis, 'setTimeout').and.callFake((fn, delay, ...args) => {
    delays.push(delay)
    return realSetTimeout(fn, 0, ...args)
  })
  return delays
}

async function failCreation(testStack, response) {
  const req = await testStack.nextRequest()
  expect(req.url).toBe('http://tus.io/files/')
  expect(req.method).toBe('POST')
  req.respondWith(response)
}

describe('tus', () => {
  describe('retry delays', () => {
    it('should keep retrying for about a minute with the default retryDelays', async () => {
      const delays = recordRetryDelays()
      const testStack = new TestHttpStack()
      const options = {
        httpStack: testStack,
        endpoint: 'http://tus.io/files/',
        onSuccess: waitableFunction('onSuccess'),
        onError: waitableFunction('onError'),
      }

      const upload = new Upload(getBlob('hello world'), options)
      upload.start()

      for (let i = 0; i < 7; i++) {
        await failCreation(testStack, { status: 502 })
      }

      let req = await testStack.nextRequest()
      req.respondWith({ status: 201, responseHeaders: { Location: '/files/foo' } })

      req = await testStack.nextRequest()
      expect(req.method).toBe('PATCH')
      req.respondWith({ status: 204, responseHeaders: { 'Upload-Offset': '11' } })

      await options.onSuccess.toBeCalled()
      expect(options.onError).not.toHaveBeenCalled()
      expect(delays).toEqual([0, 1000, 3000, 5000, 10000, 20000, 30000])
    })

    it('should emit an error once the default retryDelays are used up', async () => {
      recordRetryDelays()
      const testStack = new TestHttpStack()
      const options = {
        httpStack: testStack,
        endpoint: 'http://tus.io/files/',
        onError: waitableFunction('onError'),
      }

      const upload = new Upload(getBlob('hello world'), options)
      upload.start()

      for (let i = 0; i < 8; i++) {
        await failCreation(testStack, { status: 502 })
      }

      await options.onError.toBeCalled()
      expect(options.onError).toHaveBeenCalledTimes(1)
    })

    it('should use custom retryDelays as given', async () => {
      const delays = recordRetryDelays()
      const testStack = new TestHttpStack()
      const options = {
        httpStack: testStack,
        endpoint: 'http://tus.io/files/',
        retryDelays: [5, 15],
        onError: waitableFunction('onError'),
      }

      const upload = new Upload(getBlob('hello world'), options)
      upload.start()

      for (let i = 0; i < 3; i++) {
        await failCreation(testStack, { status: 500 })
      }

      await options.onError.toBeCalled()
      expect(delays).toEqual([5, 15])
    })

    it('should wait at least as long as the Retry-After header asks', async () => {
      const delays = recordRetryDelays()
      const testStack = new TestHttpStack()
      const options = {
        httpStack: testStack,
        endpoint: 'http://tus.io/files/',
        retryDelays: [10, 10, 10, 10],
        onError: waitableFunction('onError'),
      }

      const upload = new Upload(getBlob('hello world'), options)
      upload.start()

      // Seconds, an HTTP date, a value below the scheduled delay, and one above the cap.
      await failCreation(testStack, { status: 503, responseHeaders: { 'Retry-After': '2' } })
      const inFiveSeconds = new Date(Date.now() + 5000).toUTCString()
      await failCreation(testStack, {
        status: 503,
        responseHeaders: { 'Retry-After': inFiveSeconds },
      })
      await failCreation(testStack, { status: 503, responseHeaders: { 'Retry-After': '0' } })
      await failCreation(testStack, { status: 503, responseHeaders: { 'Retry-After': '3600' } })
      await failCreation(testStack, { status: 503 })

      await options.onError.toBeCalled()
      expect(delays[0]).toBe(2000)
      // An HTTP date is relative to the clock, so allow for the time the test takes.
      expect(delays[1]).toBeGreaterThan(3000)
      expect(delays[1]).toBeLessThanOrEqual(5000)
      expect(delays[2]).toBe(10)
      expect(delays[3]).toBe(60000)
      expect(delays.length).toBe(4)
    })

    it('should ignore an invalid Retry-After header', async () => {
      const delays = recordRetryDelays()
      const testStack = new TestHttpStack()
      const options = {
        httpStack: testStack,
        endpoint: 'http://tus.io/files/',
        retryDelays: [10],
        onError: waitableFunction('onError'),
      }

      const upload = new Upload(getBlob('hello world'), options)
      upload.start()

      await failCreation(testStack, { status: 503, responseHeaders: { 'Retry-After': 'soon' } })
      await failCreation(testStack, { status: 503 })

      await options.onError.toBeCalled()
      expect(delays).toEqual([10])
    })

    it('should not retry a non-retryable status even if it carries Retry-After', async () => {
      const delays = recordRetryDelays()
      const testStack = new TestHttpStack()
      const options = {
        httpStack: testStack,
        endpoint: 'http://tus.io/files/',
        onError: waitableFunction('onError'),
      }

      const upload = new Upload(getBlob('hello world'), options)
      upload.start()

      await failCreation(testStack, { status: 429, responseHeaders: { 'Retry-After': '1' } })

      await options.onError.toBeCalled()
      expect(delays).toEqual([])
    })

    it('should honor Retry-After when retrying a termination', async () => {
      const delays = recordRetryDelays()
      const testStack = new TestHttpStack()

      const terminating = Upload.terminate('http://tus.io/files/foo', {
        httpStack: testStack,
        retryDelays: [10],
      })

      let req = await testStack.nextRequest()
      expect(req.method).toBe('DELETE')
      req.respondWith({ status: 503, responseHeaders: { 'Retry-After': '1' } })

      req = await testStack.nextRequest()
      expect(req.method).toBe('DELETE')
      req.respondWith({ status: 204 })

      await terminating
      expect(delays).toEqual([1000])
    })
  })
})
