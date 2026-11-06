import { Upload } from 'tus-js-client'
import { getBlob, TestHttpStack } from './helpers/utils.js'

describe('tus', () => {
  describe('terminate upload', () => {
    it('should terminate upload when abort is called with true', async () => {
      let abortPromise
      const testStack = new TestHttpStack()
      const file = getBlob('hello world')
      const options = {
        httpStack: testStack,
        endpoint: 'http://tus.io/files/',
        chunkSize: 5,
        onChunkComplete() {
          abortPromise = upload.abort(true)
        },
      }

      spyOn(options, 'onChunkComplete').and.callThrough()

      const upload = new Upload(file, options)
      upload.start()

      let req = await testStack.nextRequest()
      expect(req.url).toBe('http://tus.io/files/')
      expect(req.method).toBe('POST')

      req.respondWith({
        status: 201,
        responseHeaders: {
          Location: '/files/foo',
        },
      })

      req = await testStack.nextRequest()
      expect(req.url).toBe('http://tus.io/files/foo')
      expect(req.method).toBe('PATCH')

      req.respondWith({
        status: 204,
        responseHeaders: {
          'Upload-Offset': '5',
        },
      })

      req = await testStack.nextRequest()
      expect(req.url).toBe('http://tus.io/files/foo')
      expect(req.method).toBe('DELETE')

      req.respondWith({
        status: 204,
      })

      expect(options.onChunkComplete).toHaveBeenCalled()
      await abortPromise
    })

    it('should retry terminate when an error is returned on first try', async () => {
      let abortPromise
      const testStack = new TestHttpStack()
      const file = getBlob('hello world')
      const options = {
        httpStack: testStack,
        endpoint: 'http://tus.io/files/',
        chunkSize: 5,
        retryDelays: [10, 10, 10],
        onChunkComplete() {
          abortPromise = upload.abort(true)
        },
      }

      spyOn(options, 'onChunkComplete').and.callThrough()

      const upload = new Upload(file, options)
      upload.start()

      let req = await testStack.nextRequest()
      expect(req.url).toBe('http://tus.io/files/')
      expect(req.method).toBe('POST')

      req.respondWith({
        status: 201,
        responseHeaders: {
          Location: '/files/foo',
        },
      })

      req = await testStack.nextRequest()
      expect(req.url).toBe('http://tus.io/files/foo')
      expect(req.method).toBe('PATCH')

      req.respondWith({
        status: 204,
        responseHeaders: {
          'Upload-Offset': '5',
        },
      })

      req = await testStack.nextRequest()
      expect(req.url).toBe('http://tus.io/files/foo')
      expect(req.method).toBe('DELETE')

      req.respondWith({
        status: 423,
      })

      req = await testStack.nextRequest()
      expect(req.url).toBe('http://tus.io/files/foo')
      expect(req.method).toBe('DELETE')

      req.respondWith({
        status: 204,
      })

      await abortPromise
      expect(options.onChunkComplete).toHaveBeenCalled()
    })

    it('should pass termination errors from abort to onError', async () => {
      let abortPromise
      const testStack = new TestHttpStack()
      const file = getBlob('hello world')
      const options = {
        httpStack: testStack,
        endpoint: 'http://tus.io/files/',
        chunkSize: 5,
        retryDelays: null,
        onChunkComplete() {
          abortPromise = upload.abort(true)
        },
        onError: jasmine.createSpy('onError'),
      }

      const upload = new Upload(file, options)
      upload.start()

      let req = await testStack.nextRequest()
      expect(req.method).toBe('POST')
      req.respondWith({
        status: 201,
        responseHeaders: {
          Location: '/files/foo',
        },
      })

      req = await testStack.nextRequest()
      expect(req.method).toBe('PATCH')
      req.respondWith({
        status: 204,
        responseHeaders: {
          'Upload-Offset': '5',
        },
      })

      req = await testStack.nextRequest()
      expect(req.url).toBe('http://tus.io/files/foo')
      expect(req.method).toBe('DELETE')
      req.respondWith({
        status: 404,
      })

      await expectAsync(abortPromise).toBeResolved()
      expect(options.onError).toHaveBeenCalledTimes(1)
      const err = options.onError.calls.argsFor(0)[0]
      expect(err.message).toMatch(/tus: unexpected response while terminating upload/)
      expect(err.originalResponse.getStatus()).toBe(404)
    })

    it('should reject the abort Promise if termination fails and onError is not set', async () => {
      let abortPromise
      const testStack = new TestHttpStack()
      const file = getBlob('hello world')
      const options = {
        httpStack: testStack,
        endpoint: 'http://tus.io/files/',
        chunkSize: 5,
        retryDelays: null,
        onChunkComplete() {
          abortPromise = upload.abort(true)
        },
      }

      const upload = new Upload(file, options)
      upload.start()

      let req = await testStack.nextRequest()
      req.respondWith({
        status: 201,
        responseHeaders: {
          Location: '/files/foo',
        },
      })

      req = await testStack.nextRequest()
      req.respondWith({
        status: 204,
        responseHeaders: {
          'Upload-Offset': '5',
        },
      })

      req = await testStack.nextRequest()
      expect(req.method).toBe('DELETE')
      req.respondWith({
        status: 404,
      })

      await expectAsync(abortPromise).toBeRejectedWithError(
        /tus: unexpected response while terminating upload/,
      )
    })

    it('should stop retrying when all delays are used up', async () => {
      const testStack = new TestHttpStack()
      const options = {
        httpStack: testStack,
        retryDelays: [10, 10],
      }

      const terminatePromise = Upload.terminate('http://tus.io/files/foo', options)

      let req = await testStack.nextRequest()
      expect(req.url).toBe('http://tus.io/files/foo')
      expect(req.method).toBe('DELETE')

      req.respondWith({
        status: 500,
      })

      req = await testStack.nextRequest()
      expect(req.url).toBe('http://tus.io/files/foo')
      expect(req.method).toBe('DELETE')

      req.respondWith({
        status: 500,
      })

      req = await testStack.nextRequest()
      expect(req.url).toBe('http://tus.io/files/foo')
      expect(req.method).toBe('DELETE')

      req.respondWith({
        status: 500,
      })

      await expectAsync(terminatePromise).toBeRejectedWithError(
        /tus: unexpected response while terminating upload/,
      )
    })

    it('should invoke the request and response Promises', async () => {
      const testStack = new TestHttpStack()
      const options = {
        httpStack: testStack,
        onBeforeRequest(req) {
          return new Promise((resolve) => {
            expect(req.getURL()).toBe('http://tus.io/uploads/foo')
            expect(req.getMethod()).toBe('DELETE')
            resolve()
          })
        },
        onAfterResponse(req, res) {
          return new Promise((resolve) => {
            expect(req.getURL()).toBe('http://tus.io/uploads/foo')
            expect(req.getMethod()).toBe('DELETE')
            expect(res.getStatus()).toBe(204)
            resolve()
          })
        },
      }
      spyOn(options, 'onBeforeRequest')
      spyOn(options, 'onAfterResponse')

      const terminatePromise = Upload.terminate('http://tus.io/uploads/foo', options)

      const req = await testStack.nextRequest()
      expect(req.url).toBe('http://tus.io/uploads/foo')
      expect(req.method).toBe('DELETE')

      req.respondWith({
        status: 204,
      })

      await expectAsync(terminatePromise).toBeResolved()
      expect(options.onBeforeRequest).toHaveBeenCalled()
      expect(options.onAfterResponse).toHaveBeenCalled()
    })
  })
})
