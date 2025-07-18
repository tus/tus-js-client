import { isSupported, Upload } from 'tus-js-client'
import { getBlob, TestHttpStack, TestResponse, wait, waitableFunction } from './helpers/utils.js'

// Uncomment to enable debug log from tus-js-client
// tus.enableDebugLog();

describe('tus', () => {
  describe('#isSupported', () => {
    it('should be true', () => {
      expect(isSupported).toBe(true)
    })
  })

  describe('#Upload', () => {
    it('should throw if no error handler is available', () => {
      const upload = new Upload(null)
      expect(upload.start.bind(upload)).toThrowError('tus: no file or stream to upload provided')
    })

    it('should throw if no endpoint and upload URL is provided', () => {
      const file = getBlob('hello world')
      const upload = new Upload(file)
      expect(upload.start.bind(upload)).toThrowError(
        'tus: neither an endpoint or an upload URL is provided',
      )
    })

    it('should upload a file', async () => {
      const testStack = new TestHttpStack()
      const file = getBlob('hello world')
      const options = {
        httpStack: testStack,
        endpoint: 'https://tus.io/uploads',
        headers: {
          Custom: 'blargh',
        },
        metadata: {
          foo: 'hello',
          bar: 'world',
          nonlatin: 'słońce',
          number: 100,
        },
        onProgress() {},
        onUploadUrlAvailable: waitableFunction('onUploadUrlAvailable'),
        onSuccess: waitableFunction('onSuccess'),
      }
      spyOn(options, 'onProgress')

      const upload = new Upload(file, options)
      upload.start()

      let req = await testStack.nextRequest()

      expect(req.url).toBe('https://tus.io/uploads')
      expect(req.method).toBe('POST')
      expect(req.requestHeaders.Custom).toBe('blargh')
      expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0')
      expect(req.requestHeaders['Upload-Length']).toBe('11')
      expect(req.requestHeaders['Upload-Metadata']).toBe(
        'foo aGVsbG8=,bar d29ybGQ=,nonlatin c8WCb8WEY2U=,number MTAw',
      )

      req.respondWith({
        status: 201,
        responseHeaders: {
          Location: 'https://tus.io/uploads/blargh',
        },
      })

      req = await testStack.nextRequest()

      expect(options.onUploadUrlAvailable).toHaveBeenCalled()

      expect(req.url).toBe('https://tus.io/uploads/blargh')
      expect(req.method).toBe('PATCH')
      expect(req.requestHeaders.Custom).toBe('blargh')
      expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0')
      expect(req.requestHeaders['Upload-Offset']).toBe('0')
      expect(req.requestHeaders['Content-Type']).toBe('application/offset+octet-stream')
      expect(req.bodySize).toBe(11)

      req.respondWith({
        status: 204,
        responseHeaders: {
          'Upload-Offset': '11',
        },
      })

      await options.onSuccess.toBeCalled()

      expect(upload.url).toBe('https://tus.io/uploads/blargh')
      expect(options.onProgress).toHaveBeenCalledWith(11, 11)
    })

    it('should create an upload if resuming fails', async () => {
      const testStack = new TestHttpStack()
      const file = getBlob('hello world')
      const options = {
        httpStack: testStack,
        endpoint: 'http://tus.io/uploads',
        uploadUrl: 'http://tus.io/uploads/resuming',
      }

      const upload = new Upload(file, options)
      upload.start()

      let req = await testStack.nextRequest()
      expect(req.url).toBe('http://tus.io/uploads/resuming')
      expect(req.method).toBe('HEAD')
      expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0')

      req.respondWith({
        status: 404,
      })

      req = await testStack.nextRequest()
      expect(req.url).toBe('http://tus.io/uploads')
      expect(req.method).toBe('POST')
      expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0')
      expect(req.requestHeaders['Upload-Length']).toBe('11')

      // The upload URL should be cleared when tus-js.client tries to create a new upload.
      expect(upload.url).toBe(null)
    })

    it('should create an upload using the creation-with-data extension', async () => {
      const testStack = new TestHttpStack()
      const file = getBlob('hello world')
      const options = {
        httpStack: testStack,
        endpoint: 'http://tus.io/uploads',
        uploadDataDuringCreation: true,
        onProgress() {},
        onChunkComplete() {},
        onSuccess: waitableFunction('onSuccess'),
      }

      spyOn(options, 'onProgress')
      spyOn(options, 'onChunkComplete')

      const upload = new Upload(file, options)
      upload.start()

      const req = await testStack.nextRequest()
      expect(req.url).toBe('http://tus.io/uploads')
      expect(req.method).toBe('POST')
      expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0')
      expect(req.requestHeaders['Upload-Length']).toBe('11')
      expect(req.requestHeaders['Content-Type']).toBe('application/offset+octet-stream')
      expect(req.bodySize).toBe(11)

      req.respondWith({
        status: 201,
        responseHeaders: {
          Location: 'http://tus.io/uploads/blargh',
          'Upload-Offset': '11',
        },
      })

      await options.onSuccess.toBeCalled()

      expect(options.onProgress).toHaveBeenCalledWith(11, 11)
      expect(options.onChunkComplete).toHaveBeenCalledWith(11, 11, 11)
      expect(options.onSuccess).toHaveBeenCalled()

      expect(upload.url).toBe('http://tus.io/uploads/blargh')
    })

    it('should create an upload with partial data and continue', async () => {
      const testStack = new TestHttpStack()
      const file = getBlob('hello world')
      const options = {
        httpStack: testStack,
        endpoint: 'http://tus.io/uploads',
        uploadDataDuringCreation: true,
        chunkSize: 6,
        onProgress() {},
        onChunkComplete() {},
        onSuccess: waitableFunction('onSuccess'),
      }

      spyOn(options, 'onProgress')
      spyOn(options, 'onChunkComplete')

      const upload = new Upload(file, options)
      upload.start()

      let req = await testStack.nextRequest()
      expect(req.url).toBe('http://tus.io/uploads')
      expect(req.method).toBe('POST')
      expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0')
      expect(req.requestHeaders['Upload-Length']).toBe('11')
      expect(req.requestHeaders['Content-Type']).toBe('application/offset+octet-stream')
      expect(req.bodySize).toBe(6)

      req.respondWith({
        status: 201,
        responseHeaders: {
          Location: 'http://tus.io/uploads/blargh',
          'Upload-Offset': '6',
        },
      })

      req = await testStack.nextRequest()

      // Once the second request has been sent, the progress handler must have been invoked.
      expect(options.onProgress).toHaveBeenCalledWith(6, 11)
      expect(options.onChunkComplete).toHaveBeenCalledWith(6, 6, 11)
      expect(options.onSuccess).not.toHaveBeenCalled()
      expect(upload.url).toBe('http://tus.io/uploads/blargh')

      expect(req.url).toBe('http://tus.io/uploads/blargh')
      expect(req.method).toBe('PATCH')
      expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0')
      expect(req.requestHeaders['Upload-Offset']).toBe('6')
      expect(req.requestHeaders['Content-Type']).toBe('application/offset+octet-stream')
      expect(req.bodySize).toBe(5)

      req.respondWith({
        status: 201,
        responseHeaders: {
          Location: 'http://tus.io/uploads/blargh',
          'Upload-Offset': '11',
        },
      })

      await options.onSuccess.toBeCalled()

      expect(options.onProgress).toHaveBeenCalledWith(11, 11)
      expect(options.onChunkComplete).toHaveBeenCalledWith(5, 11, 11)
      expect(options.onSuccess).toHaveBeenCalled()
    })

    it("should add the request's body and ID to errors", async () => {
      const testStack = new TestHttpStack()
      const file = getBlob('hello world')
      const options = {
        httpStack: testStack,
        endpoint: 'http://tus.io/uploads',
        addRequestId: true,
        retryDelays: null,
        onError: waitableFunction('onError'),
      }

      const upload = new Upload(file, options)
      upload.start()

      const req = await testStack.nextRequest()
      expect(req.url).toBe('http://tus.io/uploads')
      expect(req.method).toBe('POST')

      const reqId = req.requestHeaders['X-Request-ID']
      expect(typeof reqId).toBe('string')
      expect(reqId.length).toBe(36)

      req.respondWith({
        status: 500,
        responseText: 'server_error',
      })

      const err = await options.onError.toBeCalled()

      expect(err.message).toBe(
        `tus: unexpected response while creating upload, originated from request (method: POST, url: http://tus.io/uploads, response code: 500, response text: server_error, request id: ${reqId})`,
      )
      expect(err.originalRequest).toBeDefined()
      expect(err.originalResponse).toBeDefined()
    })

    it('should invoke the request and response callbacks', async () => {
      const testStack = new TestHttpStack()
      const file = getBlob('hello world')
      const options = {
        httpStack: testStack,
        uploadUrl: 'http://tus.io/uploads/foo',
        onBeforeRequest(req) {
          expect(req.getURL()).toBe('http://tus.io/uploads/foo')
          expect(req.getMethod()).toBe('HEAD')
        },
        onAfterResponse(req, res) {
          expect(req.getURL()).toBe('http://tus.io/uploads/foo')
          expect(req.getMethod()).toBe('HEAD')
          expect(res.getStatus()).toBe(204)
          expect(res.getHeader('Upload-Offset')).toBe(11)
        },
        onSuccess: waitableFunction('onSuccess'),
      }
      spyOn(options, 'onBeforeRequest')
      spyOn(options, 'onAfterResponse')

      const upload = new Upload(file, options)
      upload.start()

      const req = await testStack.nextRequest()
      expect(req.url).toBe('http://tus.io/uploads/foo')
      expect(req.method).toBe('HEAD')

      req.respondWith({
        status: 204,
        responseHeaders: {
          'Upload-Offset': '11',
          'Upload-Length': '11',
        },
      })

      await options.onSuccess.toBeCalled()
      expect(options.onBeforeRequest).toHaveBeenCalled()
      expect(options.onAfterResponse).toHaveBeenCalled()
    })

    it('should invoke the onSuccess callback with event payload', async () => {
      const testStack = new TestHttpStack()
      const file = getBlob('hello world')
      const options = {
        httpStack: testStack,
        uploadUrl: 'http://tus.io/uploads/foo',
        onSuccess: waitableFunction('onSuccess'),
      }

      const upload = new Upload(file, options)
      upload.start()

      const req = await testStack.nextRequest()
      req.respondWith({
        status: 204,
        responseHeaders: {
          'Upload-Offset': '11',
          'Upload-Length': '11',
          'Custom-Header': 'hello',
        },
      })

      const { lastResponse } = await options.onSuccess.toBeCalled()
      expect(lastResponse).toBeInstanceOf(TestResponse)
      expect(lastResponse.getHeader('Custom-Header')).toBe('hello')
    })

    it('should throw an error if resuming fails and no endpoint is provided', async () => {
      const testStack = new TestHttpStack()
      const file = getBlob('hello world')
      const options = {
        httpStack: testStack,
        uploadUrl: 'http://tus.io/uploads/resuming',
        onError: waitableFunction('onError'),
      }

      const upload = new Upload(file, options)
      upload.start()

      const req = await testStack.nextRequest()
      expect(req.url).toBe('http://tus.io/uploads/resuming')
      expect(req.method).toBe('HEAD')
      expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0')

      req.respondWith({
        status: 404,
      })

      const err = await options.onError.toBeCalled()
      expect(err.message).toBe(
        'tus: unable to resume upload (new upload cannot be created without an endpoint), originated from request (method: HEAD, url: http://tus.io/uploads/resuming, response code: 404, response text: , request id: n/a)',
      )
    })

    it('should resolve relative URLs', async () => {
      const testStack = new TestHttpStack()
      const file = getBlob('hello world')
      const options = {
        httpStack: testStack,
        endpoint: 'http://tus.io:1080/files/',
      }

      const upload = new Upload(file, options)
      upload.start()

      let req = await testStack.nextRequest()
      expect(req.url).toBe('http://tus.io:1080/files/')
      expect(req.method).toBe('POST')

      req.respondWith({
        status: 201,
        responseHeaders: {
          Location: '//localhost/uploads/foo',
        },
      })

      req = await testStack.nextRequest()
      expect(req.url).toBe('http://localhost/uploads/foo')
      expect(req.method).toBe('PATCH')

      req.respondWith({
        status: 204,
        responseHeaders: {
          'Upload-Offset': '11',
        },
      })

      expect(upload.url).toBe('http://localhost/uploads/foo')
    })

    it('should upload a file in chunks', async () => {
      const testStack = new TestHttpStack()
      const file = getBlob('hello world')
      const options = {
        httpStack: testStack,
        endpoint: 'http://tus.io/uploads',
        chunkSize: 7,
        onSuccess: waitableFunction('onSuccess'),
        onProgress() {},
        onChunkComplete() {},
      }
      spyOn(options, 'onProgress')
      spyOn(options, 'onChunkComplete')

      const upload = new Upload(file, options)
      upload.start()

      let req = await testStack.nextRequest()
      expect(req.url).toBe('http://tus.io/uploads')
      expect(req.method).toBe('POST')
      expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0')
      expect(req.requestHeaders['Upload-Length']).toBe('11')

      req.respondWith({
        status: 201,
        responseHeaders: {
          Location: '/uploads/blargh',
        },
      })

      req = await testStack.nextRequest()
      expect(req.url).toBe('http://tus.io/uploads/blargh')
      expect(req.method).toBe('PATCH')
      expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0')
      expect(req.requestHeaders['Upload-Offset']).toBe('0')
      expect(req.requestHeaders['Content-Type']).toBe('application/offset+octet-stream')
      expect(req.bodySize).toBe(7)

      req.respondWith({
        status: 204,
        responseHeaders: {
          'Upload-Offset': '7',
        },
      })

      req = await testStack.nextRequest()
      expect(req.url).toBe('http://tus.io/uploads/blargh')
      expect(req.method).toBe('PATCH')
      expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0')
      expect(req.requestHeaders['Upload-Offset']).toBe('7')
      expect(req.requestHeaders['Content-Type']).toBe('application/offset+octet-stream')
      expect(req.bodySize).toBe(4)

      req.respondWith({
        status: 204,
        responseHeaders: {
          'Upload-Offset': '11',
        },
      })

      await options.onSuccess.toBeCalled()

      expect(upload.url).toBe('http://tus.io/uploads/blargh')
      expect(options.onProgress).toHaveBeenCalledWith(11, 11)
      expect(options.onChunkComplete).toHaveBeenCalledWith(7, 7, 11)
      expect(options.onChunkComplete).toHaveBeenCalledWith(4, 11, 11)
    })

    it('should add the original request to errors', async () => {
      const testStack = new TestHttpStack()
      const file = getBlob('hello world')
      const options = {
        httpStack: testStack,
        endpoint: 'http://tus.io/uploads',
        retryDelays: null,
        onError: waitableFunction('onError'),
      }

      const upload = new Upload(file, options)
      upload.start()

      const req = await testStack.nextRequest()
      expect(req.url).toBe('http://tus.io/uploads')
      expect(req.method).toBe('POST')

      req.respondWith({
        status: 500,
        responseHeaders: {
          Custom: 'blargh',
        },
      })

      const err = await options.onError.toBeCalled()

      expect(upload.url).toBe(null)
      expect(err.message).toBe(
        'tus: unexpected response while creating upload, originated from request (method: POST, url: http://tus.io/uploads, response code: 500, response text: , request id: n/a)',
      )
      expect(err.originalRequest).toBeDefined()
      expect(err.originalResponse).toBeDefined()
      expect(err.originalResponse.getHeader('Custom')).toBe('blargh')
    })

    it('should only create an upload for empty files', async () => {
      const testStack = new TestHttpStack()
      const file = getBlob('')
      const options = {
        httpStack: testStack,
        endpoint: 'http://tus.io/uploads',
        onSuccess: waitableFunction('onSuccess'),
      }

      const upload = new Upload(file, options)
      upload.start()

      const req = await testStack.nextRequest()
      expect(req.url).toBe('http://tus.io/uploads')
      expect(req.method).toBe('POST')
      expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0')
      expect(req.requestHeaders['Upload-Length']).toBe('0')

      req.respondWith({
        status: 201,
        responseHeaders: {
          Location: 'http://tus.io/uploads/empty',
        },
      })

      await options.onSuccess.toBeCalled()
      expect(options.onSuccess).toHaveBeenCalled()
    })

    it('should not resume a finished upload', async () => {
      const testStack = new TestHttpStack()
      const file = getBlob('hello world')
      const options = {
        httpStack: testStack,
        endpoint: 'http://tus.io/uploads',
        onProgress() {},
        onSuccess: waitableFunction('onSuccess'),
        uploadUrl: 'http://tus.io/uploads/resuming',
      }
      spyOn(options, 'onProgress')

      const upload = new Upload(file, options)
      upload.start()

      const req = await testStack.nextRequest()
      expect(req.url).toBe('http://tus.io/uploads/resuming')
      expect(req.method).toBe('HEAD')
      expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0')

      req.respondWith({
        status: 204,
        responseHeaders: {
          'Upload-Length': '11',
          'Upload-Offset': '11',
        },
      })

      await options.onSuccess.toBeCalled()

      expect(options.onProgress).toHaveBeenCalledWith(11, 11)
      expect(options.onSuccess).toHaveBeenCalled()
    })

    it('should resume an upload from a specified url', async () => {
      const testStack = new TestHttpStack()
      const file = getBlob('hello world')
      const options = {
        httpStack: testStack,
        endpoint: 'http://tus.io/uploads',
        uploadUrl: 'http://tus.io/files/upload',
        onProgress() {},
        onUploadUrlAvailable: waitableFunction('onUploadUrlAvailable'),
        onSuccess: waitableFunction('onSuccess'),
        fingerprint() {},
      }
      spyOn(options, 'fingerprint').and.resolveTo('fingerprinted')
      spyOn(options, 'onProgress')

      const upload = new Upload(file, options)
      upload.start()

      expect(options.fingerprint).toHaveBeenCalled()

      let req = await testStack.nextRequest()
      expect(req.url).toBe('http://tus.io/files/upload')
      expect(req.method).toBe('HEAD')
      expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0')

      req.respondWith({
        status: 204,
        responseHeaders: {
          'Upload-Length': '11',
          'Upload-Offset': '3',
        },
      })

      req = await testStack.nextRequest()

      expect(options.onUploadUrlAvailable).toHaveBeenCalled()

      expect(req.url).toBe('http://tus.io/files/upload')
      expect(req.method).toBe('PATCH')
      expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0')
      expect(req.requestHeaders['Upload-Offset']).toBe('3')
      expect(req.requestHeaders['Content-Type']).toBe('application/offset+octet-stream')
      expect(req.bodySize).toBe(11 - 3)

      req.respondWith({
        status: 204,
        responseHeaders: {
          'Upload-Offset': '11',
        },
      })

      await options.onSuccess.toBeCalled()
      expect(options.onProgress).toHaveBeenCalledWith(11, 11)
      expect(upload.url).toBe('http://tus.io/files/upload')
    })

    it('should resume a previously started upload', async () => {
      const testStack = new TestHttpStack()
      const file = getBlob('hello world')
      const options = {
        httpStack: testStack,
        endpoint: 'http://tus.io/uploads',
        onSuccess: waitableFunction('onSuccess'),
        onError() {},
      }

      const upload = new Upload(file, options)
      upload.start()

      let req = await testStack.nextRequest()
      expect(req.url).toBe('http://tus.io/uploads')
      expect(req.method).toBe('POST')

      req.respondWith({
        status: 201,
        responseHeaders: {
          Location: 'http://tus.io/uploads/blargh',
        },
      })

      req = await testStack.nextRequest()
      expect(req.url).toBe('http://tus.io/uploads/blargh')
      expect(req.method).toBe('PATCH')

      upload.abort()

      req.respondWith({
        status: 204,
        responseHeaders: {
          'Upload-Offset': '5',
        },
      })

      upload.start()

      req = await testStack.nextRequest()
      expect(req.url).toBe('http://tus.io/uploads/blargh')
      expect(req.method).toBe('HEAD')

      req.respondWith({
        status: 204,
        responseHeaders: {
          'Upload-Offset': '5',
          'Upload-Length': '11',
        },
      })

      req = await testStack.nextRequest()
      expect(req.url).toBe('http://tus.io/uploads/blargh')
      expect(req.method).toBe('PATCH')

      req.respondWith({
        status: 204,
        responseHeaders: {
          'Upload-Offset': '11',
        },
      })

      await options.onSuccess.toBeCalled()
      expect(options.onSuccess).toHaveBeenCalled()
    })

    it('should override the PATCH method', async () => {
      const testStack = new TestHttpStack()
      const file = getBlob('hello world')
      const options = {
        httpStack: testStack,
        endpoint: 'http://tus.io/uploads',
        uploadUrl: 'http://tus.io/files/upload',
        overridePatchMethod: true,
      }

      const upload = new Upload(file, options)
      upload.start()

      let req = await testStack.nextRequest()
      expect(req.url).toBe('http://tus.io/files/upload')
      expect(req.method).toBe('HEAD')
      expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0')

      req.respondWith({
        status: 204,
        responseHeaders: {
          'Upload-Length': '11',
          'Upload-Offset': '3',
        },
      })

      req = await testStack.nextRequest()
      expect(req.url).toBe('http://tus.io/files/upload')
      expect(req.method).toBe('POST')
      expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0')
      expect(req.requestHeaders['Upload-Offset']).toBe('3')
      expect(req.requestHeaders['X-HTTP-Method-Override']).toBe('PATCH')

      req.respondWith({
        status: 204,
        responseHeaders: {
          'Upload-Offset': '11',
        },
      })
    })

    it('should emit an error if an upload is locked', async () => {
      const testStack = new TestHttpStack()
      const file = getBlob('hello world')
      const options = {
        httpStack: testStack,
        endpoint: 'http://tus.io/uploads',
        uploadUrl: 'http://tus.io/files/upload',
        onError: waitableFunction('onError'),
        retryDelays: null,
      }

      const upload = new Upload(file, options)
      upload.start()

      const req = await testStack.nextRequest()
      expect(req.url).toBe('http://tus.io/files/upload')
      expect(req.method).toBe('HEAD')

      req.respondWith({
        status: 423, // Locked
      })

      await options.onError.toBeCalled()
      expect(options.onError).toHaveBeenCalledWith(
        new Error(
          'tus: upload is currently locked; retry later, originated from request (method: HEAD, url: http://tus.io/files/upload, response code: 423, response text: , request id: n/a)',
        ),
      )
    })

    it('should emit an error if no Location header is presented', async () => {
      const testStack = new TestHttpStack()
      const file = getBlob('hello world')
      const options = {
        httpStack: testStack,
        endpoint: 'http://tus.io/uploads',
        onError: waitableFunction('onError'),
        retryDelays: null,
      }

      const upload = new Upload(file, options)
      upload.start()

      const req = await testStack.nextRequest()
      expect(req.url).toBe('http://tus.io/uploads')
      expect(req.method).toBe('POST')

      // The Location header is omitted on purpose here
      req.respondWith({
        status: 201,
      })

      await options.onError.toBeCalled()

      expect(options.onError).toHaveBeenCalledWith(
        new Error(
          'tus: invalid or missing Location header, originated from request (method: POST, url: http://tus.io/uploads, response code: 201, response text: , request id: n/a)',
        ),
      )
    })

    it('should throw an error if the source provides less data than uploadSize', async () => {
      const testStack = new TestHttpStack()
      const file = getBlob('hello world')
      const options = {
        httpStack: testStack,
        uploadSize: 100,
        endpoint: 'http://tus.io/uploads',
        retryDelays: [],
        onError: waitableFunction('onError'),
      }

      const upload = new Upload(file, options)
      upload.start()

      const req = await testStack.nextRequest()
      expect(req.url).toBe('http://tus.io/uploads')
      expect(req.method).toBe('POST')
      expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0')

      req.respondWith({
        status: 204,
        responseHeaders: {
          Location: 'http://tus.io/uploads/foo',
        },
      })

      const err = await options.onError.toBeCalled()
      expect(err.message).toBe(
        'tus: failed to upload chunk at offset 0, caused by Error: upload was configured with a size of 100 bytes, but the source is done after 11 bytes, originated from request (method: PATCH, url: http://tus.io/uploads/foo, response code: n/a, response text: n/a, request id: n/a)',
      )
    })

    it('should throw if retryDelays is not an array', () => {
      const file = getBlob('hello world')
      const upload = new Upload(file, {
        endpoint: 'http://endpoint/',
        retryDelays: 44,
      })
      expect(upload.start.bind(upload)).toThrowError(
        'tus: the `retryDelays` option must either be an array or null',
      )
    })

    // This tests ensures that tus-js-client correctly retries if the
    // response has the code 500 Internal Error, 423 Locked or 409 Conflict.
    it('should retry the upload', async () => {
      const testStack = new TestHttpStack()
      const file = getBlob('hello world')
      const options = {
        httpStack: testStack,
        endpoint: 'http://tus.io/files/',
        retryDelays: [10, 10, 10],
        onSuccess: waitableFunction('onSuccess'),
      }

      const upload = new Upload(file, options)
      upload.start()

      let req = await testStack.nextRequest()
      expect(req.url).toBe('http://tus.io/files/')
      expect(req.method).toBe('POST')

      req.respondWith({
        status: 500,
      })

      req = await testStack.nextRequest()
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
        status: 423,
      })

      req = await testStack.nextRequest()
      expect(req.url).toBe('http://tus.io/files/foo')
      expect(req.method).toBe('HEAD')

      req.respondWith({
        status: 201,
        responseHeaders: {
          'Upload-Offset': '0',
          'Upload-Length': '11',
        },
      })

      req = await testStack.nextRequest()
      expect(req.url).toBe('http://tus.io/files/foo')
      expect(req.method).toBe('PATCH')

      req.respondWith({
        status: 409,
      })

      req = await testStack.nextRequest()
      expect(req.url).toBe('http://tus.io/files/foo')
      expect(req.method).toBe('HEAD')

      req.respondWith({
        status: 201,
        responseHeaders: {
          'Upload-Offset': '0',
          'Upload-Length': '11',
        },
      })

      req = await testStack.nextRequest()
      expect(req.url).toBe('http://tus.io/files/foo')
      expect(req.method).toBe('PATCH')

      req.respondWith({
        status: 204,
        responseHeaders: {
          'Upload-Offset': '11',
        },
      })

      await options.onSuccess.toBeCalled()
      expect(options.onSuccess).toHaveBeenCalled()
    })

    // This tests ensures that tus-js-client correctly retries if the
    // return value of onShouldRetry is true.
    it('should retry the upload when onShouldRetry specified and returns true', async () => {
      const testStack = new TestHttpStack()
      const file = getBlob('hello world')
      const options = {
        httpStack: testStack,
        endpoint: 'http://tus.io/files/',
        retryDelays: [10, 10, 10],
        onSuccess: waitableFunction('onSuccess'),
        onShouldRetry: () => true,
      }

      spyOn(options, 'onShouldRetry').and.callThrough()

      const upload = new Upload(file, options)
      upload.start()

      let req = await testStack.nextRequest()
      expect(req.url).toBe('http://tus.io/files/')
      expect(req.method).toBe('POST')

      req.respondWith({
        status: 500,
      })

      req = await testStack.nextRequest()
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
        status: 423,
      })

      req = await testStack.nextRequest()
      expect(req.url).toBe('http://tus.io/files/foo')
      expect(req.method).toBe('HEAD')

      req.respondWith({
        status: 201,
        responseHeaders: {
          'Upload-Offset': '0',
          'Upload-Length': '11',
        },
      })

      req = await testStack.nextRequest()
      expect(req.url).toBe('http://tus.io/files/foo')
      expect(req.method).toBe('PATCH')

      req.respondWith({
        status: 409,
      })

      req = await testStack.nextRequest()
      expect(req.url).toBe('http://tus.io/files/foo')
      expect(req.method).toBe('HEAD')

      req.respondWith({
        status: 201,
        responseHeaders: {
          'Upload-Offset': '0',
          'Upload-Length': '11',
        },
      })

      req = await testStack.nextRequest()
      expect(req.url).toBe('http://tus.io/files/foo')
      expect(req.method).toBe('PATCH')

      req.respondWith({
        status: 204,
        responseHeaders: {
          'Upload-Offset': '11',
        },
      })

      await options.onSuccess.toBeCalled()
      expect(options.onSuccess).toHaveBeenCalled()

      expect(options.onShouldRetry).toHaveBeenCalled()
      const args1 = options.onShouldRetry.calls.argsFor(0)
      expect(args1[0].message).toEqual(
        'tus: unexpected response while creating upload, originated from request (method: POST, url: http://tus.io/files/, response code: 500, response text: , request id: n/a)',
      )
      expect(args1[1]).toEqual(0)
      expect(args1[2]).toEqual(upload.options)

      const args2 = options.onShouldRetry.calls.argsFor(1)
      expect(args2[0].message).toEqual(
        'tus: unexpected response while uploading chunk, originated from request (method: PATCH, url: http://tus.io/files/foo, response code: 423, response text: , request id: n/a)',
      )
      expect(args2[1]).toEqual(1)
      expect(args2[2]).toEqual(upload.options)
    })

    // This tests ensures that tus-js-client correctly aborts if the
    // return value of onShouldRetry is false.
    it('should not retry the upload when callback specified and returns false', async () => {
      const testStack = new TestHttpStack()
      const file = getBlob('hello world')
      const options = {
        httpStack: testStack,
        endpoint: 'http://tus.io/files/',
        retryDelays: [10, 10, 10],
        onSuccess: waitableFunction('onSuccess'),
        onError: waitableFunction('onError'),
        onShouldRetry: () => false,
      }

      const upload = new Upload(file, options)
      upload.start()

      const req = await testStack.nextRequest()
      expect(req.url).toBe('http://tus.io/files/')
      expect(req.method).toBe('POST')

      // The error callback should not be invoked for the first error response.
      expect(options.onError).not.toHaveBeenCalled()

      req.respondWith({
        status: 500,
      })

      await options.onError.toBeCalled()

      expect(options.onSuccess).not.toHaveBeenCalled()
      expect(options.onError).toHaveBeenCalledTimes(1)
    })

    it('should not retry if the error has not been caused by a request', async () => {
      const file = getBlob('hello world')
      const options = {
        httpStack: new TestHttpStack(),
        endpoint: 'http://tus.io/files/',
        retryDelays: [10, 10, 10],
        onSuccess() {},
        onError() {},
      }

      spyOn(options, 'onSuccess')
      spyOn(options, 'onError')

      const upload = new Upload(file, options)
      spyOn(upload, '_createUpload')
      upload.start()

      await wait(200)

      const error = new Error('custom error')
      upload._emitError(error)

      expect(upload._createUpload).toHaveBeenCalledTimes(1)
      expect(options.onError).toHaveBeenCalledWith(error)
      expect(options.onSuccess).not.toHaveBeenCalled()
    })

    it('should stop retrying after all delays have been used', async () => {
      const testStack = new TestHttpStack()
      const file = getBlob('hello world')
      const options = {
        httpStack: testStack,
        endpoint: 'http://tus.io/files/',
        retryDelays: [10],
        onSuccess() {},
        onError: waitableFunction('onError'),
      }
      spyOn(options, 'onSuccess')

      const upload = new Upload(file, options)
      upload.start()

      let req = await testStack.nextRequest()
      expect(req.url).toBe('http://tus.io/files/')
      expect(req.method).toBe('POST')

      req.respondWith({
        status: 500,
      })

      req = await testStack.nextRequest()
      expect(req.url).toBe('http://tus.io/files/')
      expect(req.method).toBe('POST')

      // The error callback should not be invoked for the first error response.
      expect(options.onError).not.toHaveBeenCalled()

      req.respondWith({
        status: 500,
      })

      await options.onError.toBeCalled()

      expect(options.onSuccess).not.toHaveBeenCalled()
      expect(options.onError).toHaveBeenCalledTimes(1)
    })

    it('should stop retrying when the abort function is called', async () => {
      const testStack = new TestHttpStack()
      const file = getBlob('hello world')
      const options = {
        httpStack: testStack,
        endpoint: 'http://tus.io/files/',
        retryDelays: [10],
        onError() {},
      }

      spyOn(options, 'onError')

      const upload = new Upload(file, options)
      upload.start()

      const req = await testStack.nextRequest()
      expect(req.url).toBe('http://tus.io/files/')
      expect(req.method).toBe('POST')

      spyOn(upload, 'start').and.callThrough()

      upload.abort()

      req.respondWith({
        status: 500,
      })

      const result = await Promise.race([testStack.nextRequest(), wait(100)])

      expect(result).toBe('timed out')
    })

    it('should stop upload when the abort function is called during a callback', async () => {
      const testStack = new TestHttpStack()
      const file = getBlob('hello world')
      const options = {
        httpStack: testStack,
        endpoint: 'http://tus.io/files/',
        chunkSize: 5,
        onChunkComplete() {
          upload.abort()
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

      const result = await Promise.race([testStack.nextRequest(), wait(200)])

      expect(options.onChunkComplete).toHaveBeenCalled()
      expect(result).toBe('timed out')
    })

    it('should stop upload when the abort function is called during the POST request', async () => {
      const testStack = new TestHttpStack()
      const file = getBlob('hello world')
      const options = {
        httpStack: testStack,
        endpoint: 'http://tus.io/files/',
        onError() {},
      }

      spyOn(options, 'onError').and.callThrough()

      const upload = new Upload(file, options)
      upload.start()

      const req = await testStack.nextRequest()
      expect(req.url).toBe('http://tus.io/files/')
      expect(req.method).toBe('POST')

      upload.abort()

      req.respondWith({
        status: 201,
        responseHeaders: {
          Location: '/files/foo',
        },
      })

      const result = await Promise.race([testStack.nextRequest(), wait(200)])

      expect(options.onError).not.toHaveBeenCalled()
      expect(result).toBe('timed out')
    })

    it('should reset the attempt counter if an upload proceeds', async () => {
      const testStack = new TestHttpStack()
      const file = getBlob('hello world')
      const options = {
        httpStack: testStack,
        endpoint: 'http://tus.io/files/',
        retryDelays: [10],
        onError() {},
        onSuccess: waitableFunction('onSuccess'),
      }
      spyOn(options, 'onError')

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
        status: 500,
      })

      req = await testStack.nextRequest()
      expect(req.url).toBe('http://tus.io/files/foo')
      expect(req.method).toBe('HEAD')

      req.respondWith({
        status: 204,
        responseHeaders: {
          'Upload-Offset': '0',
          'Upload-Length': '11',
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
      expect(req.method).toBe('PATCH')

      req.respondWith({
        status: 500,
      })

      req = await testStack.nextRequest()
      expect(req.url).toBe('http://tus.io/files/foo')
      expect(req.method).toBe('HEAD')

      req.respondWith({
        status: 204,
        responseHeaders: {
          'Upload-Offset': '5',
          'Upload-Length': '11',
        },
      })

      req = await testStack.nextRequest()
      expect(req.url).toBe('http://tus.io/files/foo')
      expect(req.method).toBe('PATCH')

      req.respondWith({
        status: 204,
        responseHeaders: {
          'Upload-Offset': '11',
        },
      })

      await options.onSuccess.toBeCalled()
      expect(options.onError).not.toHaveBeenCalled()
      expect(options.onSuccess).toHaveBeenCalled()
    })

    it('should send upload length on the last request when length is deferred and we know the total size', async () => {
      const testStack = new TestHttpStack()
      const file = getBlob('hello world')
      const options = {
        httpStack: testStack,
        endpoint: 'http://tus.io/uploads',
        uploadUrl: 'http://tus.io/uploads/resuming',
        chunkSize: 4,
        // No `uploadLengthDeferred: true` here, but the client learns
        // about the deferred length from the HEAD response.
      }

      const upload = new Upload(file, options)
      upload.start()

      let req = await testStack.nextRequest()
      expect(req.url).toBe('http://tus.io/uploads/resuming')
      expect(req.method).toBe('HEAD')

      req.respondWith({
        status: 204,
        responseHeaders: {
          'Upload-Defer-Length': '1',
          'Upload-Offset': '5',
        },
      })

      req = await testStack.nextRequest()
      expect(req.url).toBe('http://tus.io/uploads/resuming')
      expect(req.method).toBe('PATCH')
      expect(req.requestHeaders['Upload-Offset']).toBe('5')
      expect(req.requestHeaders['Upload-Length']).toBe(undefined)
      expect(req.body.size).toBe(4)
      expect(await req.body.text()).toBe(' wor')

      req.respondWith({
        status: 204,
        responseHeaders: {
          'Upload-Offset': '9',
        },
      })

      req = await testStack.nextRequest()
      expect(req.url).toBe('http://tus.io/uploads/resuming')
      expect(req.method).toBe('PATCH')
      expect(req.requestHeaders['Upload-Offset']).toBe('9')
      expect(req.requestHeaders['Upload-Length']).toBe('11')
      expect(req.body.size).toBe(2)
      expect(await req.body.text()).toBe('ld')

      req.respondWith({
        status: 204,
        responseHeaders: {
          'Upload-Offset': '11',
        },
      })
    })
  })
})
