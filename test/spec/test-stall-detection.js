import { Upload } from 'tus-js-client'
import { TestHttpStack, getBlob, wait, waitableFunction } from './helpers/utils.js'

/**
 * Helper to get body size for various input types
 */
function getBodySize(body) {
  if (body == null) return null
  if (body instanceof Blob) return body.size
  if (body.length != null) return body.length
  return 0
}

/**
 * Enhanced HTTP stack for testing stall detection scenarios
 * Supports both complete stalls and custom progress sequences
 */
class StallTestHttpStack extends TestHttpStack {
  constructor() {
    super()
    this.stallOnNextPatch = false
    this.progressSequences = new Map()
    this.progressPromises = new Map()
    this.nextProgressSequence = null
  }

  /**
   * Configure the stack to stall on the next PATCH request
   */
  simulateStallOnNextPatch() {
    this.stallOnNextPatch = true
  }

  /**
   * Set a custom progress sequence for the next PATCH request
   * @param {Array} sequence - Array of {bytes: number, delay: number} objects
   */
  setNextProgressSequence(sequence) {
    this.nextProgressSequence = sequence
  }

  supportsProgressEvents() {
    return true
  }

  createRequest(method, url) {
    const req = super.createRequest(method, url)

    if (method === 'PATCH') {
      this._setupPatchRequest(req)
    }

    return req
  }

  _setupPatchRequest(req) {
    const self = this

    // Handle complete stalls
    if (this.stallOnNextPatch) {
      this.stallOnNextPatch = false
      req.send = async function (body) {
        this.body = body
        if (body) {
          this.bodySize = await getBodySize(body)
          // Don't call progress handler to simulate a complete stall
        }
        this._onRequestSend(this)
        return this._requestPromise
      }
      return
    }

    // Handle progress sequences
    if (this.nextProgressSequence) {
      this.progressSequences.set(req, this.nextProgressSequence)
      this.nextProgressSequence = null
    }

    // Override respondWith to wait for progress events
    const originalRespondWith = req.respondWith.bind(req)
    req.respondWith = async (resData) => {
      const progressPromise = self.progressPromises.get(req)
      if (progressPromise) {
        await progressPromise
        self.progressPromises.delete(req)
      }
      originalRespondWith(resData)
    }

    // Override send to handle progress sequences
    req.send = async function (body) {
      this.body = body
      if (body) {
        this.bodySize = await getBodySize(body)
      }

      const progressSequence = self.progressSequences.get(req)
      if (progressSequence && this._onProgress) {
        self._scheduleProgressSequence(req, progressSequence, this._onProgress)
      } else if (this._onProgress) {
        self._scheduleDefaultProgress(req, this._onProgress, this.bodySize)
      }

      this._onRequestSend(this)
      return this._requestPromise
    }
  }

  _scheduleProgressSequence(req, sequence, progressHandler) {
    const progressPromise = new Promise((resolve) => {
      setTimeout(async () => {
        for (const event of sequence) {
          await new Promise((resolve) => setTimeout(resolve, event.delay || 0))
          progressHandler(event.bytes)
        }
        resolve()
      }, 10) // Small delay to ensure stall detector is started
    })
    this.progressPromises.set(req, progressPromise)
  }

  _scheduleDefaultProgress(req, progressHandler, bodySize) {
    const progressPromise = new Promise((resolve) => {
      setTimeout(() => {
        progressHandler(0)
        progressHandler(bodySize)
        resolve()
      }, 10) // Small delay to ensure stall detector is started
    })
    this.progressPromises.set(req, progressPromise)
  }
}

/**
 * Common test setup helper
 */
function createTestUpload(options = {}) {
  const defaultOptions = {
    httpStack: new StallTestHttpStack(),
    endpoint: 'https://tus.io/uploads',
    onError: waitableFunction('onError'),
    onSuccess: waitableFunction('onSuccess'),
    onProgress: waitableFunction('onProgress'),
  }

  const file = options.file || getBlob('hello world')
  const uploadOptions = { ...defaultOptions, ...options }
  const upload = new Upload(file, uploadOptions)

  return { upload, options: uploadOptions, testStack: uploadOptions.httpStack }
}

/**
 * Helper to handle standard upload creation flow
 */
async function handleUploadCreation(testStack, location = '/uploads/12345') {
  const req = await testStack.nextRequest()
  expect(req.method).toBe('POST')
  req.respondWith({
    status: 201,
    responseHeaders: {
      Location: location,
    },
  })
  return req
}

describe('tus-stall-detection', () => {
  describe('integration tests', () => {
    it("should not enable stall detection if HTTP stack doesn't support progress events", async () => {
      const { enableDebugLog } = await import('tus-js-client')
      enableDebugLog()

      const testStack = new TestHttpStack()
      testStack.supportsProgressEvents = () => false

      const { upload } = createTestUpload({
        httpStack: testStack,
        stallDetection: { enabled: true },
      })

      // Capture console output
      const originalLog = console.log
      let loggedMessage = ''
      console.log = (message) => {
        loggedMessage += message
      }

      upload.start()

      const req = await testStack.nextRequest()
      expect(req.url).toBe('https://tus.io/uploads')
      expect(req.method).toBe('POST')
      req.respondWith({
        status: 201,
        responseHeaders: { Location: '/uploads/12345' },
      })

      await wait(50)
      console.log = originalLog

      expect(loggedMessage).toContain(
        'tus: stall detection is enabled but the HTTP stack does not support progress events',
      )

      upload.abort()
    })

    it('should upload a file with stall detection enabled', async () => {
      const { upload, options, testStack } = createTestUpload({
        stallDetection: {
          enabled: true,
          checkInterval: 1000,
          stallTimeout: 2000,
        },
      })

      upload.start()

      await handleUploadCreation(testStack)

      const patchReq = await testStack.nextRequest()
      expect(patchReq.url).toBe('https://tus.io/uploads/12345')
      expect(patchReq.method).toBe('PATCH')

      patchReq.respondWith({
        status: 204,
        responseHeaders: { 'Upload-Offset': '11' },
      })

      await options.onSuccess.toBeCalled()
      expect(options.onError.calls.count()).toBe(0)
    })

    it('should detect stalls and emit error when no retries configured', async () => {
      const { upload, options, testStack } = createTestUpload({
        stallDetection: {
          enabled: true,
          checkInterval: 100,
          stallTimeout: 200,
        },
        retryDelays: null,
      })

      testStack.simulateStallOnNextPatch()
      upload.start()

      await handleUploadCreation(testStack)

      const error = await options.onError.toBeCalled()
      expect(error.message).toContain('Upload stalled')
    })

    it('should retry when stall is detected', async () => {
      const { upload, options, testStack } = createTestUpload({
        stallDetection: {
          enabled: true,
          checkInterval: 100,
          stallTimeout: 200,
        },
        retryDelays: [100],
      })

      testStack.simulateStallOnNextPatch()
      upload.start()

      let requestCount = 0
      while (true) {
        const req = await testStack.nextRequest()
        requestCount++

        if (req.method === 'POST') {
          req.respondWith({
            status: 201,
            responseHeaders: { Location: '/uploads/12345' },
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
          req.respondWith({
            status: 204,
            responseHeaders: { 'Upload-Offset': '11' },
          })
          break
        }

        if (requestCount > 10) {
          throw new Error('Too many requests')
        }
      }

      await options.onSuccess.toBeCalled()
      expect(options.onError.calls.count()).toBe(0)
      expect(requestCount).toBeGreaterThan(1)
    })

    it('should not incorrectly detect stalls during onBeforeRequest delays', async () => {
      const { upload, options, testStack } = createTestUpload({
        stallDetection: {
          enabled: true,
          checkInterval: 100,
          stallTimeout: 200,
        },
        onBeforeRequest: async (_req) => {
          await wait(300) // Longer than stall timeout
        },
      })

      upload.start()

      await handleUploadCreation(testStack)

      const patchReq = await testStack.nextRequest()
      expect(patchReq.url).toBe('https://tus.io/uploads/12345')
      expect(patchReq.method).toBe('PATCH')

      patchReq.respondWith({
        status: 204,
        responseHeaders: { 'Upload-Offset': '11' },
      })

      await options.onSuccess.toBeCalled()
      expect(options.onError.calls.count()).toBe(0)
    })

    it('should detect stalls when progress events stop mid-upload', async () => {
      const file = getBlob('hello world'.repeat(100))
      const { upload, options, testStack } = createTestUpload({
        file,
        stallDetection: {
          enabled: true,
          checkInterval: 100,
          stallTimeout: 200,
        },
        retryDelays: null,
      })

      // Create a progress sequence that stops at 30% of the file
      const fileSize = file.size
      const progressSequence = [
        { bytes: 0, delay: 10 },
        { bytes: Math.floor(fileSize * 0.1), delay: 50 },
        { bytes: Math.floor(fileSize * 0.2), delay: 50 },
        { bytes: Math.floor(fileSize * 0.3), delay: 50 },
        // No more progress events after 30%
      ]

      testStack.setNextProgressSequence(progressSequence)
      upload.start()
      await handleUploadCreation(testStack)

      const error = await options.onError.toBeCalled()
      expect(error.message).toContain('Upload stalled')
      expect(options.onProgress.calls.count()).toBeGreaterThan(0)
    })

    it('should detect stalls when progress value does not change', async () => {
      const { upload, options, testStack } = createTestUpload({
        stallDetection: {
          enabled: true,
          checkInterval: 50,
          stallTimeout: 500,
        },
        retryDelays: null,
      })

      // Create a progress sequence that gets stuck at 300 bytes
      const progressSequence = [
        { bytes: 0, delay: 10 },
        { bytes: 100, delay: 10 },
        { bytes: 200, delay: 10 },
        { bytes: 300, delay: 10 },
        // Repeat the same value to trigger value-based stall detection
        ...Array(12).fill({ bytes: 300, delay: 30 }),
      ]

      testStack.setNextProgressSequence(progressSequence)
      upload.start()

      await handleUploadCreation(testStack)

      const patchReq = await testStack.nextRequest()
      expect(patchReq.method).toBe('PATCH')

      const error = await options.onError.toBeCalled()
      expect(error.message).toContain('Upload stalled: no progress')
      expect(options.onProgress.calls.count()).toBeGreaterThan(0)
    })
  })
})
