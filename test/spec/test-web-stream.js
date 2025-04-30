import { Upload } from 'tus-js-client'
import { TestHttpStack, waitableFunction } from './helpers/utils.js'

describe('tus', () => {
  describe('#Upload', () => {
    describe('uploading data from a Web Stream ReadableStream', () => {
      function makeReader(content, readSize = content.length) {
        let remainingData = new TextEncoder().encode(content)
        return new ReadableStream({
          pull(controller) {
            if (remainingData.length > 0) {
              const chunk = remainingData.subarray(0, readSize)
              remainingData = remainingData.subarray(readSize)
              controller.enqueue(chunk)
            } else {
              controller.close()
            }
          },
        })
      }

      async function assertReaderUpload({ readSize, chunkSize }) {
        const reader = makeReader('hello world', readSize)

        const testStack = new TestHttpStack()
        const options = {
          httpStack: testStack,
          endpoint: 'http://tus.io/uploads',
          chunkSize,
          onProgress: waitableFunction('onProgress'),
          onSuccess: waitableFunction('onSuccess'),
          fingerprint() {},
          uploadLengthDeferred: true,
        }
        spyOn(options, 'fingerprint').and.resolveTo('fingerprinted')

        const upload = new Upload(reader, options)
        upload.start()

        expect(options.fingerprint).toHaveBeenCalledWith(reader, upload.options)

        let req = await testStack.nextRequest()
        expect(req.url).toBe('http://tus.io/uploads')
        expect(req.method).toBe('POST')
        expect(req.requestHeaders['Upload-Length']).toBe(undefined)
        expect(req.requestHeaders['Upload-Defer-Length']).toBe('1')

        req.respondWith({
          status: 201,
          responseHeaders: {
            Location: 'http://tus.io/uploads/blargh',
          },
        })

        req = await testStack.nextRequest()
        expect(req.url).toBe('http://tus.io/uploads/blargh')
        expect(req.method).toBe('PATCH')
        expect(req.requestHeaders['Upload-Offset']).toBe('0')
        expect(req.requestHeaders['Upload-Length']).toBe('11')
        expect(req.requestHeaders['Content-Type']).toBe('application/offset+octet-stream')
        expect(req.bodySize).toBe(11)

        req.respondWith({
          status: 204,
          responseHeaders: {
            'Upload-Offset': '11',
          },
        })

        await options.onProgress.toBeCalled
        expect(options.onProgress).toHaveBeenCalledWith(0, 11)

        await options.onSuccess.toBeCalled
        expect(upload.url).toBe('http://tus.io/uploads/blargh')
        expect(options.onProgress).toHaveBeenCalledWith(11, 11)
      }

      it('should upload data', async () => {
        await assertReaderUpload({ chunkSize: 100, readSize: 100 })
      })

      it('should read multiple times from the reader', async () => {
        await assertReaderUpload({ chunkSize: 100, readSize: 6 })
      })

      it('should use multiple PATCH requests', async () => {
        const reader = makeReader('hello world', 1)

        const testStack = new TestHttpStack()
        const options = {
          httpStack: testStack,
          endpoint: 'http://tus.io/uploads',
          chunkSize: 6,
          onProgress: waitableFunction('onProgress'),
          onSuccess: waitableFunction('onSuccess'),
          fingerprint() {},
          uploadLengthDeferred: true,
        }
        spyOn(options, 'fingerprint').and.resolveTo('fingerprinted')

        const upload = new Upload(reader, options)
        upload.start()

        expect(options.fingerprint).toHaveBeenCalledWith(reader, upload.options)

        let req = await testStack.nextRequest()
        expect(req.url).toBe('http://tus.io/uploads')
        expect(req.method).toBe('POST')
        expect(req.requestHeaders['Upload-Length']).toBe(undefined)
        expect(req.requestHeaders['Upload-Defer-Length']).toBe('1')

        req.respondWith({
          status: 201,
          responseHeaders: {
            Location: 'http://tus.io/uploads/blargh',
          },
        })

        req = await testStack.nextRequest()
        expect(req.url).toBe('http://tus.io/uploads/blargh')
        expect(req.method).toBe('PATCH')
        expect(req.requestHeaders['Upload-Offset']).toBe('0')
        expect(req.requestHeaders['Content-Type']).toBe('application/offset+octet-stream')
        expect(req.bodySize).toBe(6)

        req.respondWith({
          status: 204,
          responseHeaders: {
            'Upload-Offset': '6',
          },
        })

        await options.onProgress.toBeCalled
        expect(options.onProgress).toHaveBeenCalledWith(6, null)

        req = await testStack.nextRequest()
        expect(req.url).toBe('http://tus.io/uploads/blargh')
        expect(req.method).toBe('PATCH')
        expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0')
        expect(req.requestHeaders['Upload-Offset']).toBe('6')
        expect(req.requestHeaders['Upload-Length']).toBe('11')
        expect(req.requestHeaders['Content-Type']).toBe('application/offset+octet-stream')
        expect(req.bodySize).toBe(5)

        req.respondWith({
          status: 204,
          responseHeaders: {
            'Upload-Offset': '11',
          },
        })

        await options.onSuccess.toBeCalled
        expect(upload.url).toBe('http://tus.io/uploads/blargh')
        expect(options.onProgress).toHaveBeenCalledWith(11, 11)
      })

      it('should retry the POST request', async () => {
        const reader = makeReader('hello world', 1)

        const testStack = new TestHttpStack()
        const options = {
          httpStack: testStack,
          endpoint: 'http://tus.io/files/',
          chunkSize: 11,
          retryDelays: [10, 10, 10],
          onSuccess: waitableFunction('onSuccess'),
          uploadLengthDeferred: true,
        }

        const upload = new Upload(reader, options)
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
          status: 204,
          responseHeaders: {
            'Upload-Offset': '11',
          },
        })

        req = await testStack.nextRequest()
        expect(req.url).toBe('http://tus.io/files/foo')
        expect(req.method).toBe('PATCH')
        expect(req.requestHeaders['Upload-Length']).toBe('11')

        req.respondWith({
          status: 204,
          responseHeaders: {
            'Upload-Offset': '11',
          },
        })

        await options.onSuccess.toBeCalled
      })

      it('should retry the first PATCH request', async () => {
        const reader = makeReader('hello world', 1)

        const testStack = new TestHttpStack()
        const options = {
          httpStack: testStack,
          endpoint: 'http://tus.io/files/',
          chunkSize: 11,
          retryDelays: [10, 10, 10],
          onSuccess: waitableFunction('onSuccess'),
          uploadLengthDeferred: true,
        }

        const upload = new Upload(reader, options)
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

        req = await testStack.nextRequest()
        expect(req.url).toBe('http://tus.io/files/foo')
        expect(req.method).toBe('PATCH')
        expect(req.requestHeaders['Upload-Length']).toBe('11')

        req.respondWith({
          status: 204,
          responseHeaders: {
            'Upload-Offset': '11',
          },
        })

        await options.onSuccess.toBeCalled
      })

      it('should retry following PATCH requests', async () => {
        const reader = makeReader('hello world there!')

        const testStack = new TestHttpStack()
        const options = {
          httpStack: testStack,
          endpoint: 'http://tus.io/files/',
          chunkSize: 6,
          retryDelays: [10, 10, 10],
          onSuccess() {},
          uploadLengthDeferred: true,
        }

        const upload = new Upload(reader, options)
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
            'Upload-Offset': '6',
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
            'Upload-Offset': '6',
          },
        })

        req = await testStack.nextRequest()
        expect(req.url).toBe('http://tus.io/files/foo')
        expect(req.method).toBe('PATCH')

        req.respondWith({
          status: 204,
          responseHeaders: {
            'Upload-Offset': '12',
          },
        })

        req = await testStack.nextRequest()
        expect(req.url).toBe('http://tus.io/files/foo')
        expect(req.method).toBe('PATCH')

        req.respondWith({
          status: 204,
          responseHeaders: {
            'Upload-Offset': '18',
          },
        })

        req = await testStack.nextRequest()
        expect(req.url).toBe('http://tus.io/files/foo')
        expect(req.method).toBe('PATCH')
        expect(req.requestHeaders['Upload-Length']).toBe('18')

        req.respondWith({
          status: 204,
          responseHeaders: {
            'Upload-Offset': '18',
          },
        })

        await options.onSuccess.toBeCalled
      })

      it('should throw an error if the source provides less data than uploadSize', async () => {
        const reader = makeReader('hello world')

        const testStack = new TestHttpStack()
        const options = {
          httpStack: testStack,
          uploadSize: 100,
          chunkSize: 100,
          endpoint: 'http://tus.io/uploads',
          retryDelays: [],
          onError: waitableFunction('onError'),
        }

        const upload = new Upload(reader, options)
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

        const err = await options.onError.toBeCalled
        expect(err.message).toBe(
          'tus: failed to upload chunk at offset 0, caused by Error: upload was configured with a size of 100 bytes, but the source is done after 11 bytes, originated from request (method: PATCH, url: http://tus.io/uploads/foo, response code: n/a, response text: n/a, request id: n/a)',
        )
      })
    })
  })
})
