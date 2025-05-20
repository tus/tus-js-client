import { Upload } from 'tus-js-client'
import { TestHttpStack, getBlob, waitableFunction } from './helpers/utils.js'

// Custom HTTP stack that can simulate stalls
class StallSimulatingHttpStack extends TestHttpStack {
  constructor() {
    super()
    this.stallOnNextPatch = false
  }

  createRequest(method, url) {
    const req = super.createRequest(method, url)

    // If we want to simulate a stall on PATCH requests, override the send method
    if (this.stallOnNextPatch && method === 'PATCH') {
      this.stallOnNextPatch = false
      req.send = async function (body) {
        this.body = body
        if (body) {
          this.bodySize = await getBodySize(body)
          // Don't call progress handler to simulate a stall
        }
        this._onRequestSend(this)
        return this._requestPromise
      }
    }

    return req
  }

  supportsProgressEvents() {
    return true
  }
}

// Helper to get body size
function getBodySize(body) {
  if (body == null) return null
  if (body instanceof Blob) return body.size
  if (body.length != null) return body.length
  return 0
}

describe('tus-stall-detection', () => {
  describe('integration tests', () => {
    it("should not enable stall detection if HTTP stack doesn't support progress events", async () => {
      // Enable debug logging temporarily
      const { enableDebugLog } = await import('tus-js-client')
      enableDebugLog()

      const testStack = new TestHttpStack()
      // Mock the stack to not support progress events
      testStack.supportsProgressEvents = () => false

      const file = getBlob('hello world')

      const options = {
        httpStack: testStack,
        endpoint: 'https://tus.io/uploads',
        stallDetection: {
          enabled: true,
        },
        onError: waitableFunction('onError'),
      }

      const upload = new Upload(file, options)

      // Capture console output
      const originalLog = console.log
      let loggedMessage = ''
      console.log = (message) => {
        loggedMessage += message
      }

      upload.start()

      // Handle the POST request
      const req = await testStack.nextRequest()
      expect(req.url).toBe('https://tus.io/uploads')
      expect(req.method).toBe('POST')
      req.respondWith({
        status: 201,
        responseHeaders: {
          Location: '/uploads/12345',
        },
      })

      // Wait a bit for any async operations
      await new Promise((resolve) => setTimeout(resolve, 50))

      // Restore console.log
      console.log = originalLog

      // Check that stall detection was disabled with appropriate log message
      expect(loggedMessage).toContain(
        'tus: stall detection is enabled but the HTTP stack does not support progress events, it will be disabled for this upload',
      )

      // Abort to clean up
      upload.abort()
    })

    it('should upload a file with stall detection enabled', async () => {
      const testStack = new TestHttpStack()
      // Mock the stack to support progress events
      testStack.supportsProgressEvents = () => true

      const file = getBlob('hello world')

      const options = {
        httpStack: testStack,
        endpoint: 'https://tus.io/uploads',
        stallDetection: {
          enabled: true,
          checkInterval: 1000,
          stallTimeout: 2000,
        },
        onSuccess: waitableFunction('onSuccess'),
        onError: waitableFunction('onError'),
      }

      const upload = new Upload(file, options)
      upload.start()

      // Handle the POST request to create the upload
      let req = await testStack.nextRequest()
      expect(req.url).toBe('https://tus.io/uploads')
      expect(req.method).toBe('POST')

      req.respondWith({
        status: 201,
        responseHeaders: {
          Location: '/uploads/12345',
        },
      })

      // Handle the PATCH request to upload the file
      req = await testStack.nextRequest()
      expect(req.url).toBe('https://tus.io/uploads/12345')
      expect(req.method).toBe('PATCH')

      // Complete the upload quickly (before stall detection triggers)
      req.respondWith({
        status: 204,
        responseHeaders: {
          'Upload-Offset': '11',
        },
      })

      // Wait for the upload to complete successfully
      await options.onSuccess.toBeCalled()

      // Make sure the error callback was not called
      expect(options.onError.calls.count()).toBe(0)
    })

    it('should detect stalls and emit error when no retries configured', async () => {
      const testStack = new StallSimulatingHttpStack()
      const file = getBlob('hello world')

      const options = {
        httpStack: testStack,
        endpoint: 'https://tus.io/uploads',
        stallDetection: {
          enabled: true,
          checkInterval: 100, // Fast check interval for testing
          stallTimeout: 200, // Short timeout for testing
        },
        // No retries to get immediate error
        retryDelays: null,
        onError: waitableFunction('onError'),
        onSuccess: waitableFunction('onSuccess'),
      }

      const upload = new Upload(file, options)

      // Tell the stack to simulate a stall on the next PATCH request
      testStack.stallOnNextPatch = true

      upload.start()

      // Handle the POST request to create the upload
      const req = await testStack.nextRequest()
      expect(req.method).toBe('POST')
      req.respondWith({
        status: 201,
        responseHeaders: {
          Location: '/uploads/12345',
        },
      })

      // The PATCH request should be sent but will stall
      // Don't wait for the response since it will be aborted

      // Wait for stall detection to trigger and error to be emitted
      const error = await options.onError.toBeCalled()
      expect(error.message).toContain('Upload stalled')
    })

    it('should retry when stall is detected', async () => {
      const testStack = new StallSimulatingHttpStack()
      const file = getBlob('hello world')

      let requestCount = 0

      const options = {
        httpStack: testStack,
        endpoint: 'https://tus.io/uploads',
        stallDetection: {
          enabled: true,
          checkInterval: 100, // Fast check interval for testing
          stallTimeout: 200, // Short timeout for testing
        },
        // Enable retries
        retryDelays: [100],
        onError: waitableFunction('onError'),
        onSuccess: waitableFunction('onSuccess'),
      }

      const upload = new Upload(file, options)

      // Tell the stack to simulate a stall on the first PATCH request only
      testStack.stallOnNextPatch = true

      upload.start()

      // Keep handling requests until success
      while (true) {
        const req = await testStack.nextRequest()
        requestCount++

        if (req.method === 'POST') {
          req.respondWith({
            status: 201,
            responseHeaders: {
              Location: '/uploads/12345',
            },
          })
        } else if (req.method === 'HEAD') {
          req.respondWith({
            status: 200,
            responseHeaders: {
              'Upload-Offset': '0',
              'Upload-Length': '11',
            },
          })
        } else if (req.method === 'PATCH') {
          // Complete the upload on any PATCH that isn't stalled
          req.respondWith({
            status: 204,
            responseHeaders: {
              'Upload-Offset': '11',
            },
          })
          break
        }

        // Safety check to avoid infinite loop
        if (requestCount > 10) {
          throw new Error('Too many requests')
        }
      }

      // Wait for success
      await options.onSuccess.toBeCalled()

      // Error should not have been called since we retried
      expect(options.onError.calls.count()).toBe(0)

      // We should have had more than 1 request (at least POST + PATCH)
      expect(requestCount).toBeGreaterThan(1)
    })

    it('should not incorrectly detect stalls during onBeforeRequest delays', async () => {
      const testStack = new TestHttpStack()
      // Mock the stack to support progress events
      testStack.supportsProgressEvents = () => true

      const file = getBlob('hello world')

      const options = {
        httpStack: testStack,
        endpoint: 'https://tus.io/uploads',
        stallDetection: {
          enabled: true,
          checkInterval: 100,
          stallTimeout: 200,
        },
        onBeforeRequest: async (_req) => {
          // Simulate a long-running operation like fetching auth tokens
          await new Promise((resolve) => setTimeout(resolve, 300))
        },
        onSuccess: waitableFunction('onSuccess'),
        onError: waitableFunction('onError'),
      }

      const upload = new Upload(file, options)
      upload.start()

      // Handle the POST request to create the upload
      let req = await testStack.nextRequest()
      expect(req.url).toBe('https://tus.io/uploads')
      expect(req.method).toBe('POST')

      req.respondWith({
        status: 201,
        responseHeaders: {
          Location: '/uploads/12345',
        },
      })

      // Handle the PATCH request
      req = await testStack.nextRequest()
      expect(req.url).toBe('https://tus.io/uploads/12345')
      expect(req.method).toBe('PATCH')

      // Complete the upload
      req.respondWith({
        status: 204,
        responseHeaders: {
          'Upload-Offset': '11',
        },
      })

      // Wait for the upload to complete successfully
      await options.onSuccess.toBeCalled()

      // Stall detection should not have triggered during the onBeforeRequest delay
      expect(options.onError.calls.count()).toBe(0)
    })

    it('should detect stalls when progress events stop mid-upload', async () => {
      const testStack = new TestHttpStack()
      const file = getBlob('hello world'.repeat(100)) // Larger file for multiple progress events

      let progressCallCount = 0
      let progressHandler = null

      // Override createRequest to capture and control progress events
      const originalCreateRequest = testStack.createRequest.bind(testStack)
      testStack.createRequest = function(method, url) {
        const req = originalCreateRequest(method, url)

        if (method === 'PATCH') {
          const originalSetProgressHandler = req.setProgressHandler.bind(req)
          req.setProgressHandler = function(handler) {
            progressHandler = handler
            originalSetProgressHandler(handler)
          }

          // Override send to simulate progress events that stop
          const originalSend = req.send.bind(req)
          req.send = async function(body) {
            const result = originalSend(body)

            // Simulate some progress events then stop
            if (progressHandler && body) {
              const totalSize = await getBodySize(body)
              // Send progress events for first 30% of upload
              for (let i = 0; i <= 3; i++) {
                progressCallCount++
                progressHandler(Math.floor(totalSize * 0.1 * i))
                await new Promise(resolve => setTimeout(resolve, 50))
              }
              // Then stop sending progress events to simulate a stall
            }

            return result
          }
        }

        return req
      }

      const options = {
        httpStack: testStack,
        endpoint: 'https://tus.io/uploads',
        stallDetection: {
          enabled: true,
          checkInterval: 100,
          stallTimeout: 200,
        },
        retryDelays: null, // No retries to get immediate error
        onError: waitableFunction('onError'),
        onProgress: waitableFunction('onProgress'),
      }

      const upload = new Upload(file, options)
      upload.start()

      // Handle the POST request
      const req = await testStack.nextRequest()
      expect(req.method).toBe('POST')
      req.respondWith({
        status: 201,
        responseHeaders: {
          Location: '/uploads/12345',
        },
      })

      // The PATCH request will start sending progress events then stall

      // Wait for stall detection to trigger
      const error = await options.onError.toBeCalled()
      expect(error.message).toContain('Upload stalled')

      // Verify that we received some progress events before the stall
      expect(progressCallCount).toBeGreaterThan(0)
      expect(options.onProgress.calls.count()).toBeGreaterThan(0)
    })
  })
})
