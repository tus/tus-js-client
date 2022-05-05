const { TestHttpStack, waitableFunction, getBlob } = require('./helpers/utils')
const tus = require('../..')

describe('tus', () => {
  describe('parallel uploading with stagger', () => {
    it('should throw if staggerPercent is passed without parallelUploads', () => {
      const file = getBlob('hello world')
      const upload = new tus.Upload(file, {
        endpoint      : 'https://tus.io/uploads',
        staggerPercent: 50,
        uploadUrl     : 'foo',
      })
      expect(upload.start.bind(upload)).toThrowError('tus: cannot use the staggerPercent option when parallelUploads is disabled')
    })

    it('should stagger a multi-part upload, one chunk per part', async () => {
      const testStack = new TestHttpStack()

      const testUrlStorage = {
        addUpload: (fingerprint, upload) => {
          expect(fingerprint).toBe('fingerprinted')
          expect(upload.uploadUrl).toBeUndefined()
          expect(upload.size).toBe(10)
          expect(upload.parallelUploadUrls).toEqual([
            'https://tus.io/uploads/upload1',
            'https://tus.io/uploads/upload2',
          ])

          return Promise.resolve('tus::fingerprinted::1337')
        },
        removeUpload: (urlStorageKey) => {
          expect(urlStorageKey).toBe('tus::fingerprinted::1337')
          return Promise.resolve()
        },
      }
      spyOn(testUrlStorage, 'removeUpload').and.callThrough()
      spyOn(testUrlStorage, 'addUpload').and.callThrough()

      const file = getBlob('helloworld')
      const options = {
        httpStack                  : testStack,
        urlStorage                 : testUrlStorage,
        storeFingerprintForResuming: true,
        removeFingerprintOnSuccess : true,
        chunkSize                  : 5,
        parallelUploads            : 2,
        splitSizeIntoParts         : () => {
          return [{ start: 0, end: 5 }, { start: 5, end: 10 }]
        },
        staggerPercent: 50,
        retryDelays   : [10],
        endpoint      : 'https://tus.io/uploads',
        headers       : {
          Custom: 'blargh',
        },
        metadata: {
          foo: 'hello',
        },
        onProgress () {},
        onSuccess  : waitableFunction(),
        fingerprint: () => Promise.resolve('fingerprinted'),
      }
      spyOn(options, 'onProgress')

      const upload = new tus.Upload(file, options)
      upload.start()

      let req

      {
        req = await testStack.nextRequest()
        expect(req.url).toBe('https://tus.io/uploads')
        expect(req.method).toBe('POST')
        expect(req.requestHeaders.Custom).toBe('blargh')
        expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0')
        expect(req.requestHeaders['Upload-Length']).toBe(5)
        expect(req.requestHeaders['Upload-Concat']).toBe('partial')
        expect(req.requestHeaders['Upload-Metadata']).toBeUndefined()

        req.respondWith({
          status         : 201,
          responseHeaders: {
            Location: 'https://tus.io/uploads/upload1',
          },
        })
      }

      {
        req = await testStack.nextRequest()

        expect(req.url).toBe('https://tus.io/uploads/upload1')
        expect(req.method).toBe('PATCH')
        expect(req.requestHeaders.Custom).toBe('blargh')
        expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0')
        expect(req.requestHeaders['Upload-Offset']).toBe(0)
        expect(req.requestHeaders['Content-Type']).toBe('application/offset+octet-stream')
        expect(req.body.size).toBe(5)

        req.respondWith({
          status         : 204,
          responseHeaders: {
            'Upload-Offset': 5,
          },
        })
      }

      {
        req = await testStack.nextRequest()

        expect(req.url).toBe('https://tus.io/uploads')
        expect(req.method).toBe('POST')
        expect(req.requestHeaders.Custom).toBe('blargh')
        expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0')
        expect(req.requestHeaders['Upload-Length']).toBe(5)
        expect(req.requestHeaders['Upload-Concat']).toBe('partial')
        expect(req.requestHeaders['Upload-Metadata']).toBeUndefined()

        req.respondWith({
          status         : 201,
          responseHeaders: {
            Location: 'https://tus.io/uploads/upload2',
          },
        })
      }

      {
        req = await testStack.nextRequest()

        // Assert that the URLs have been stored.
        expect(testUrlStorage.addUpload).toHaveBeenCalled()

        expect(req.url).toBe('https://tus.io/uploads/upload2')
        expect(req.method).toBe('PATCH')
        expect(req.requestHeaders.Custom).toBe('blargh')
        expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0')
        expect(req.requestHeaders['Upload-Offset']).toBe(0)
        expect(req.requestHeaders['Content-Type']).toBe('application/offset+octet-stream')
        expect(req.body.size).toBe(5)

        // Return an error to ensure that the individual partial upload is properly retried.
        req.respondWith({
          status: 500,
        })
      }

      {
        req = await testStack.nextRequest()
        expect(req.url).toBe('https://tus.io/uploads/upload2')
        expect(req.method).toBe('HEAD')

        req.respondWith({
          status         : 204,
          responseHeaders: {
            'Upload-Length': 10,
            'Upload-Offset': 0,
          },
        })
      }

      {
        req = await testStack.nextRequest()
        expect(req.url).toBe('https://tus.io/uploads/upload2')
        expect(req.method).toBe('PATCH')
        expect(req.requestHeaders.Custom).toBe('blargh')
        expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0')
        expect(req.requestHeaders['Upload-Offset']).toBe(0)
        expect(req.requestHeaders['Content-Type']).toBe('application/offset+octet-stream')
        expect(req.body.size).toBe(5)

        req.respondWith({
          status         : 204,
          responseHeaders: {
            'Upload-Offset': 5,
          },
        })
      }

      {
        req = await testStack.nextRequest()
        expect(req.url).toBe('https://tus.io/uploads')
        expect(req.method).toBe('POST')
        expect(req.requestHeaders.Custom).toBe('blargh')
        expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0')
        expect(req.requestHeaders['Upload-Length']).toBeUndefined()
        expect(req.requestHeaders['Upload-Concat']).toBe('final;https://tus.io/uploads/upload1 https://tus.io/uploads/upload2')
        expect(req.requestHeaders['Upload-Metadata']).toBe('foo aGVsbG8=')

        req.respondWith({
          status         : 201,
          responseHeaders: {
            Location: 'https://tus.io/uploads/upload3',
          },
        })
      }

      await options.onSuccess.toBeCalled

      expect(upload.url).toBe('https://tus.io/uploads/upload3')
      expect(options.onProgress).toHaveBeenCalledWith(5, 10)
      expect(options.onProgress).toHaveBeenCalledWith(10, 10)
      expect(testUrlStorage.removeUpload).toHaveBeenCalled()
    })

    it('should stagger a multi-part upload, mix of chunk amounts per part', async () => {
      const testStack = new TestHttpStack()

      const testUrlStorage = {
        addUpload: (fingerprint, upload) => {
          expect(fingerprint).toBe('fingerprinted')
          expect(upload.uploadUrl).toBeUndefined()
          expect(upload.size).toBe(15)
          expect(upload.parallelUploadUrls).toEqual([
            'https://tus.io/uploads/upload1',
            'https://tus.io/uploads/upload2',
          ])

          return Promise.resolve('tus::fingerprinted::1337')
        },
        removeUpload: (urlStorageKey) => {
          expect(urlStorageKey).toBe('tus::fingerprinted::1337')
          return Promise.resolve()
        },
      }
      spyOn(testUrlStorage, 'removeUpload').and.callThrough()
      spyOn(testUrlStorage, 'addUpload').and.callThrough()

      const file = getBlob('hello world1234')
      const options = {
        httpStack                  : testStack,
        urlStorage                 : testUrlStorage,
        storeFingerprintForResuming: true,
        removeFingerprintOnSuccess : true,
        chunkSize                  : 5,
        parallelUploads            : 2,
        splitSizeIntoParts         : () => {
          return [{ start: 0, end: 10 }, { start: 10, end: 15 }]
        },
        staggerPercent: 50,
        retryDelays   : [10],
        endpoint      : 'https://tus.io/uploads',
        headers       : {
          Custom: 'blargh',
        },
        metadata: {
          foo: 'hello',
        },
        onProgress () {},
        onSuccess  : waitableFunction(),
        fingerprint: () => Promise.resolve('fingerprinted'),
      }
      spyOn(options, 'onProgress')

      const upload = new tus.Upload(file, options)
      upload.start()

      let req

      {
        req = await testStack.nextRequest()
        expect(req.url).toBe('https://tus.io/uploads')
        expect(req.method).toBe('POST')
        expect(req.requestHeaders.Custom).toBe('blargh')
        expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0')
        expect(req.requestHeaders['Upload-Length']).toBe(10)
        expect(req.requestHeaders['Upload-Concat']).toBe('partial')
        expect(req.requestHeaders['Upload-Metadata']).toBeUndefined()

        req.respondWith({
          status         : 201,
          responseHeaders: {
            Location: 'https://tus.io/uploads/upload1',
          },
        })
      }

      {
        req = await testStack.nextRequest()

        expect(req.url).toBe('https://tus.io/uploads/upload1')
        expect(req.method).toBe('PATCH')
        expect(req.requestHeaders.Custom).toBe('blargh')
        expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0')
        expect(req.requestHeaders['Upload-Offset']).toBe(0)
        expect(req.requestHeaders['Content-Type']).toBe('application/offset+octet-stream')
        expect(req.body.size).toBe(5)

        req.respondWith({
          status         : 204,
          responseHeaders: {
            'Upload-Offset': 5,
          },
        })
      }

      {
        req = await testStack.nextRequest()

        expect(req.url).toBe('https://tus.io/uploads')
        expect(req.method).toBe('POST')
        expect(req.requestHeaders.Custom).toBe('blargh')
        expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0')
        expect(req.requestHeaders['Upload-Length']).toBe(5)
        expect(req.requestHeaders['Upload-Concat']).toBe('partial')
        expect(req.requestHeaders['Upload-Metadata']).toBeUndefined()

        req.respondWith({
          status         : 201,
          responseHeaders: {
            Location: 'https://tus.io/uploads/upload2',
          },
        })
      }

      {
        req = await testStack.nextRequest()

        // Assert that the URLs have been stored.
        expect(testUrlStorage.addUpload).toHaveBeenCalled()

        expect(req.url).toBe('https://tus.io/uploads/upload2')
        expect(req.method).toBe('PATCH')
        expect(req.requestHeaders.Custom).toBe('blargh')
        expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0')
        expect(req.requestHeaders['Upload-Offset']).toBe(0)
        expect(req.requestHeaders['Content-Type']).toBe('application/offset+octet-stream')
        expect(req.body.size).toBe(5)

        // Return an error to ensure that the individual partial upload is properly retried.
        req.respondWith({
          status: 500,
        })
      }

      {
        req = await testStack.nextRequest()

        expect(req.url).toBe('https://tus.io/uploads/upload1')
        expect(req.method).toBe('PATCH')
        expect(req.requestHeaders.Custom).toBe('blargh')
        expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0')
        expect(req.requestHeaders['Upload-Offset']).toBe(5)
        expect(req.requestHeaders['Content-Type']).toBe('application/offset+octet-stream')
        expect(req.body.size).toBe(5)

        req.respondWith({
          status         : 204,
          responseHeaders: {
            'Upload-Offset': 10,
          },
        })
      }

      {
        req = await testStack.nextRequest()
        expect(req.url).toBe('https://tus.io/uploads/upload2')
        expect(req.method).toBe('HEAD')

        req.respondWith({
          status         : 204,
          responseHeaders: {
            'Upload-Length': 15,
            'Upload-Offset': 0,
          },
        })
      }

      {
        req = await testStack.nextRequest()
        expect(req.url).toBe('https://tus.io/uploads/upload2')
        expect(req.method).toBe('PATCH')
        expect(req.requestHeaders.Custom).toBe('blargh')
        expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0')
        expect(req.requestHeaders['Upload-Offset']).toBe(0)
        expect(req.requestHeaders['Content-Type']).toBe('application/offset+octet-stream')
        expect(req.body.size).toBe(5)

        req.respondWith({
          status         : 204,
          responseHeaders: {
            'Upload-Offset': 5,
          },
        })
      }

      {
        req = await testStack.nextRequest()
        expect(req.url).toBe('https://tus.io/uploads')
        expect(req.method).toBe('POST')
        expect(req.requestHeaders.Custom).toBe('blargh')
        expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0')
        expect(req.requestHeaders['Upload-Length']).toBeUndefined()
        expect(req.requestHeaders['Upload-Concat']).toBe('final;https://tus.io/uploads/upload1 https://tus.io/uploads/upload2')
        expect(req.requestHeaders['Upload-Metadata']).toBe('foo aGVsbG8=')

        req.respondWith({
          status         : 201,
          responseHeaders: {
            Location: 'https://tus.io/uploads/upload3',
          },
        })
      }

      await options.onSuccess.toBeCalled

      expect(upload.url).toBe('https://tus.io/uploads/upload3')
      expect(options.onProgress).toHaveBeenCalledWith(5, 15)
      expect(options.onProgress).toHaveBeenCalledWith(10, 15)
      expect(options.onProgress).toHaveBeenCalledWith(15, 15)
      expect(testUrlStorage.removeUpload).toHaveBeenCalled()
    })

    it('should stagger a multi-part upload, one chunk per part, last part having leftover', async () => {
      const testStack = new TestHttpStack()

      const testUrlStorage = {
        addUpload: (fingerprint, upload) => {
          expect(fingerprint).toBe('fingerprinted')
          expect(upload.uploadUrl).toBeUndefined()
          expect(upload.size).toBe(11)
          expect(upload.parallelUploadUrls).toEqual([
            'https://tus.io/uploads/upload1',
            'https://tus.io/uploads/upload2',
          ])

          return Promise.resolve('tus::fingerprinted::1337')
        },
        removeUpload: (urlStorageKey) => {
          expect(urlStorageKey).toBe('tus::fingerprinted::1337')
          return Promise.resolve()
        },
      }
      spyOn(testUrlStorage, 'removeUpload').and.callThrough()
      spyOn(testUrlStorage, 'addUpload').and.callThrough()

      const file = getBlob('hello world')
      const options = {
        httpStack                  : testStack,
        urlStorage                 : testUrlStorage,
        storeFingerprintForResuming: true,
        removeFingerprintOnSuccess : true,
        chunkSize                  : 5,
        parallelUploads            : 2,
        splitSizeIntoParts         : () => {
          return [{ start: 0, end: 5 }, { start: 5, end: 11 }]
        },
        staggerPercent: 50,
        retryDelays   : [10],
        endpoint      : 'https://tus.io/uploads',
        headers       : {
          Custom: 'blargh',
        },
        metadata: {
          foo: 'hello',
        },
        onProgress () {},
        onSuccess  : waitableFunction(),
        fingerprint: () => Promise.resolve('fingerprinted'),
      }
      spyOn(options, 'onProgress')

      const upload = new tus.Upload(file, options)
      upload.start()

      let req

      {
        req = await testStack.nextRequest()
        expect(req.url).toBe('https://tus.io/uploads')
        expect(req.method).toBe('POST')
        expect(req.requestHeaders.Custom).toBe('blargh')
        expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0')
        expect(req.requestHeaders['Upload-Length']).toBe(6)
        expect(req.requestHeaders['Upload-Concat']).toBe('partial')
        expect(req.requestHeaders['Upload-Metadata']).toBeUndefined()

        req.respondWith({
          status         : 201,
          responseHeaders: {
            Location: 'https://tus.io/uploads/upload2',
          },
        })
      }

      {
        req = await testStack.nextRequest()

        expect(req.url).toBe('https://tus.io/uploads/upload2')
        expect(req.method).toBe('PATCH')
        expect(req.requestHeaders.Custom).toBe('blargh')
        expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0')
        expect(req.requestHeaders['Upload-Offset']).toBe(0)
        expect(req.requestHeaders['Content-Type']).toBe('application/offset+octet-stream')
        expect(req.body.size).toBe(5)

        // Return an error to ensure that the individual partial upload is properly retried.
        req.respondWith({
          status: 500,
        })
      }

      {
        req = await testStack.nextRequest()

        expect(req.url).toBe('https://tus.io/uploads')
        expect(req.method).toBe('POST')
        expect(req.requestHeaders.Custom).toBe('blargh')
        expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0')
        expect(req.requestHeaders['Upload-Length']).toBe(5)
        expect(req.requestHeaders['Upload-Concat']).toBe('partial')
        expect(req.requestHeaders['Upload-Metadata']).toBeUndefined()

        req.respondWith({
          status         : 201,
          responseHeaders: {
            Location: 'https://tus.io/uploads/upload1',
          },
        })
      }

      {
        req = await testStack.nextRequest()

        // Assert that the URLs have been stored.
        expect(testUrlStorage.addUpload).toHaveBeenCalled()

        expect(req.url).toBe('https://tus.io/uploads/upload1')
        expect(req.method).toBe('PATCH')
        expect(req.requestHeaders.Custom).toBe('blargh')
        expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0')
        expect(req.requestHeaders['Upload-Offset']).toBe(0)
        expect(req.requestHeaders['Content-Type']).toBe('application/offset+octet-stream')
        expect(req.body.size).toBe(5)

        req.respondWith({
          status         : 204,
          responseHeaders: {
            'Upload-Offset': 5,
          },
        })
      }

      {
        req = await testStack.nextRequest()
        expect(req.url).toBe('https://tus.io/uploads/upload2')
        expect(req.method).toBe('HEAD')

        req.respondWith({
          status         : 204,
          responseHeaders: {
            'Upload-Length': 11,
            'Upload-Offset': 0,
          },
        })
      }

      {
        req = await testStack.nextRequest()
        expect(req.url).toBe('https://tus.io/uploads/upload2')
        expect(req.method).toBe('PATCH')
        expect(req.requestHeaders.Custom).toBe('blargh')
        expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0')
        expect(req.requestHeaders['Upload-Offset']).toBe(0)
        expect(req.requestHeaders['Content-Type']).toBe('application/offset+octet-stream')
        expect(req.body.size).toBe(5)

        req.respondWith({
          status         : 204,
          responseHeaders: {
            'Upload-Offset': 6,
          },
        })
      }

      {
        req = await testStack.nextRequest()
        expect(req.url).toBe('https://tus.io/uploads')
        expect(req.method).toBe('POST')
        expect(req.requestHeaders.Custom).toBe('blargh')
        expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0')
        expect(req.requestHeaders['Upload-Length']).toBeUndefined()
        expect(req.requestHeaders['Upload-Concat']).toBe('final;https://tus.io/uploads/upload1 https://tus.io/uploads/upload2')
        expect(req.requestHeaders['Upload-Metadata']).toBe('foo aGVsbG8=')

        req.respondWith({
          status         : 201,
          responseHeaders: {
            Location: 'https://tus.io/uploads/upload3',
          },
        })
      }

      await options.onSuccess.toBeCalled

      expect(upload.url).toBe('https://tus.io/uploads/upload3')
      expect(options.onProgress).toHaveBeenCalledWith(5, 11)
      expect(options.onProgress).toHaveBeenCalledWith(10, 11)
      expect(options.onProgress).toHaveBeenCalledWith(11, 11)
      expect(testUrlStorage.removeUpload).toHaveBeenCalled()
    })

    it('should stagger a multi-part upload, mix of chunk amounts per part, last part having leftover', async () => {
      const testStack = new TestHttpStack()

      const testUrlStorage = {
        addUpload: (fingerprint, upload) => {
          expect(fingerprint).toBe('fingerprinted')
          expect(upload.uploadUrl).toBeUndefined()
          expect(upload.size).toBe(16)
          expect(upload.parallelUploadUrls).toEqual([
            'https://tus.io/uploads/upload1',
            'https://tus.io/uploads/upload2',
          ])

          return Promise.resolve('tus::fingerprinted::1337')
        },
        removeUpload: (urlStorageKey) => {
          expect(urlStorageKey).toBe('tus::fingerprinted::1337')
          return Promise.resolve()
        },
      }
      spyOn(testUrlStorage, 'removeUpload').and.callThrough()
      spyOn(testUrlStorage, 'addUpload').and.callThrough()

      const file = getBlob('hello world12345')
      const options = {
        httpStack                  : testStack,
        urlStorage                 : testUrlStorage,
        storeFingerprintForResuming: true,
        removeFingerprintOnSuccess : true,
        chunkSize                  : 5,
        parallelUploads            : 2,
        splitSizeIntoParts         : () => {
          return [{ start: 0, end: 10 }, { start: 10, end: 16 }]
        },
        staggerPercent: 50,
        retryDelays   : [10],
        endpoint      : 'https://tus.io/uploads',
        headers       : {
          Custom: 'blargh',
        },
        metadata: {
          foo: 'hello',
        },
        onProgress () {},
        onSuccess  : waitableFunction(),
        fingerprint: () => Promise.resolve('fingerprinted'),
      }
      spyOn(options, 'onProgress')

      const upload = new tus.Upload(file, options)
      upload.start()

      let req

      {
        req = await testStack.nextRequest()
        expect(req.url).toBe('https://tus.io/uploads')
        expect(req.method).toBe('POST')
        expect(req.requestHeaders.Custom).toBe('blargh')
        expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0')
        expect(req.requestHeaders['Upload-Length']).toBe(10)
        expect(req.requestHeaders['Upload-Concat']).toBe('partial')
        expect(req.requestHeaders['Upload-Metadata']).toBeUndefined()

        req.respondWith({
          status         : 201,
          responseHeaders: {
            Location: 'https://tus.io/uploads/upload1',
          },
        })
      }

      {
        req = await testStack.nextRequest()

        expect(req.url).toBe('https://tus.io/uploads/upload1')
        expect(req.method).toBe('PATCH')
        expect(req.requestHeaders.Custom).toBe('blargh')
        expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0')
        expect(req.requestHeaders['Upload-Offset']).toBe(0)
        expect(req.requestHeaders['Content-Type']).toBe('application/offset+octet-stream')
        expect(req.body.size).toBe(5)

        req.respondWith({
          status         : 204,
          responseHeaders: {
            'Upload-Offset': 5,
          },
        })
      }

      {
        req = await testStack.nextRequest()

        expect(req.url).toBe('https://tus.io/uploads')
        expect(req.method).toBe('POST')
        expect(req.requestHeaders.Custom).toBe('blargh')
        expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0')
        expect(req.requestHeaders['Upload-Length']).toBe(6)
        expect(req.requestHeaders['Upload-Concat']).toBe('partial')
        expect(req.requestHeaders['Upload-Metadata']).toBeUndefined()

        req.respondWith({
          status         : 201,
          responseHeaders: {
            Location: 'https://tus.io/uploads/upload2',
          },
        })
      }

      {
        req = await testStack.nextRequest()

        // Assert that the URLs have been stored.
        expect(testUrlStorage.addUpload).toHaveBeenCalled()

        expect(req.url).toBe('https://tus.io/uploads/upload2')
        expect(req.method).toBe('PATCH')
        expect(req.requestHeaders.Custom).toBe('blargh')
        expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0')
        expect(req.requestHeaders['Upload-Offset']).toBe(0)
        expect(req.requestHeaders['Content-Type']).toBe('application/offset+octet-stream')
        expect(req.body.size).toBe(5)

        // Return an error to ensure that the individual partial upload is properly retried.
        req.respondWith({
          status: 500,
        })
      }

      {
        req = await testStack.nextRequest()

        expect(req.url).toBe('https://tus.io/uploads/upload1')
        expect(req.method).toBe('PATCH')
        expect(req.requestHeaders.Custom).toBe('blargh')
        expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0')
        expect(req.requestHeaders['Upload-Offset']).toBe(5)
        expect(req.requestHeaders['Content-Type']).toBe('application/offset+octet-stream')
        expect(req.body.size).toBe(5)

        req.respondWith({
          status         : 204,
          responseHeaders: {
            'Upload-Offset': 10,
          },
        })
      }

      {
        req = await testStack.nextRequest()
        expect(req.url).toBe('https://tus.io/uploads/upload2')
        expect(req.method).toBe('HEAD')

        req.respondWith({
          status         : 204,
          responseHeaders: {
            'Upload-Length': 15,
            'Upload-Offset': 0,
          },
        })
      }

      {
        req = await testStack.nextRequest()
        expect(req.url).toBe('https://tus.io/uploads/upload2')
        expect(req.method).toBe('PATCH')
        expect(req.requestHeaders.Custom).toBe('blargh')
        expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0')
        expect(req.requestHeaders['Upload-Offset']).toBe(0)
        expect(req.requestHeaders['Content-Type']).toBe('application/offset+octet-stream')
        expect(req.body.size).toBe(5)

        req.respondWith({
          status         : 204,
          responseHeaders: {
            'Upload-Offset': 5,
          },
        })
      }

      {
        req = await testStack.nextRequest()
        expect(req.url).toBe('https://tus.io/uploads/upload2')
        expect(req.method).toBe('PATCH')
        expect(req.requestHeaders.Custom).toBe('blargh')
        expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0')
        expect(req.requestHeaders['Upload-Offset']).toBe(5)
        expect(req.requestHeaders['Content-Type']).toBe('application/offset+octet-stream')
        expect(req.body.size).toBe(1)

        req.respondWith({
          status         : 204,
          responseHeaders: {
            'Upload-Offset': 6,
          },
        })
      }

      {
        req = await testStack.nextRequest()
        expect(req.url).toBe('https://tus.io/uploads')
        expect(req.method).toBe('POST')
        expect(req.requestHeaders.Custom).toBe('blargh')
        expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0')
        expect(req.requestHeaders['Upload-Length']).toBeUndefined()
        expect(req.requestHeaders['Upload-Concat']).toBe('final;https://tus.io/uploads/upload1 https://tus.io/uploads/upload2')
        expect(req.requestHeaders['Upload-Metadata']).toBe('foo aGVsbG8=')

        req.respondWith({
          status         : 201,
          responseHeaders: {
            Location: 'https://tus.io/uploads/upload3',
          },
        })
      }

      await options.onSuccess.toBeCalled

      expect(upload.url).toBe('https://tus.io/uploads/upload3')
      expect(options.onProgress).toHaveBeenCalledWith(5, 16)
      expect(options.onProgress).toHaveBeenCalledWith(10, 16)
      expect(options.onProgress).toHaveBeenCalledWith(15, 16)
      expect(options.onProgress).toHaveBeenCalledWith(16, 16)
      expect(testUrlStorage.removeUpload).toHaveBeenCalled()
    })
  })
})
