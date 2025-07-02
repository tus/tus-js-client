import { defaultOptions, Upload } from 'tus-js-client'
import { assertUrlStorage } from './helpers/assertUrlStorage.js'
import { TestHttpStack, wait, waitableFunction } from './helpers/utils.js'

describe('tus', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('#Upload', () => {
    it('should resume an upload from a stored url', async () => {
      localStorage.setItem(
        'tus::fingerprinted::1337',
        JSON.stringify({
          uploadUrl: 'http://tus.io/uploads/resuming',
        }),
      )

      const testStack = new TestHttpStack()
      const file = new Blob('hello world'.split(''))
      const options = {
        httpStack: testStack,
        endpoint: 'http://tus.io/uploads',
        onProgress() {},
        fingerprint() {},
      }
      spyOn(options, 'fingerprint').and.resolveTo('fingerprinted')
      spyOn(options, 'onProgress')

      const upload = new Upload(file, options)

      const previousUploads = await upload.findPreviousUploads()
      expect(previousUploads).toEqual([
        {
          uploadUrl: 'http://tus.io/uploads/resuming',
          urlStorageKey: 'tus::fingerprinted::1337',
        },
      ])
      upload.resumeFromPreviousUpload(previousUploads[0])

      upload.start()

      expect(options.fingerprint).toHaveBeenCalledWith(file, upload.options)

      let req = await testStack.nextRequest()
      expect(req.url).toBe('http://tus.io/uploads/resuming')
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
      expect(req.url).toBe('http://tus.io/uploads/resuming')
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

      expect(upload.url).toBe('http://tus.io/uploads/resuming')
      expect(options.onProgress).toHaveBeenCalledWith(11, 11)
    })

    describe('storing of upload urls', () => {
      const testStack = new TestHttpStack()
      const options = {
        httpStack: testStack,
        endpoint: 'http://tus.io/uploads',
        fingerprint() {},
      }

      async function startUpload() {
        const file = new Blob('hello world'.split(''))
        spyOn(options, 'fingerprint').and.resolveTo('fingerprinted')
        options.onSuccess = waitableFunction('onSuccess')

        const upload = new Upload(file, options)
        upload.start()

        expect(options.fingerprint).toHaveBeenCalled()

        const req = await testStack.nextRequest()
        expect(req.url).toBe('http://tus.io/uploads')
        expect(req.method).toBe('POST')

        req.respondWith({
          status: 201,
          responseHeaders: {
            Location: '/uploads/blargh',
          },
        })

        // Wait a short delay to allow the Promises to settle
        await wait(10)
      }

      async function finishUpload() {
        const req = await testStack.nextRequest()
        expect(req.url).toBe('http://tus.io/uploads/blargh')
        expect(req.method).toBe('PATCH')

        req.respondWith({
          status: 204,
          responseHeaders: {
            'Upload-Offset': '11',
          },
        })

        await options.onSuccess.toBeCalled()
      }

      it('should store and retain with default options', async () => {
        options.removeFingerprintOnSuccess = false
        await startUpload()

        const key = localStorage.key(0)
        expect(key.indexOf('tus::fingerprinted::')).toBe(0)

        const storedUpload = JSON.parse(localStorage.getItem(key))
        expect(storedUpload.uploadUrl).toBe('http://tus.io/uploads/blargh')
        expect(storedUpload.size).toBe(11)

        await finishUpload()

        expect(localStorage.getItem(key)).toBe(JSON.stringify(storedUpload))
      })

      it('should store and remove with option removeFingerprintOnSuccess set', async () => {
        options.removeFingerprintOnSuccess = true
        await startUpload()

        const key = localStorage.key(0)
        expect(key.indexOf('tus::fingerprinted::')).toBe(0)

        const storedUpload = JSON.parse(localStorage.getItem(key))
        expect(storedUpload.uploadUrl).toBe('http://tus.io/uploads/blargh')
        expect(storedUpload.size).toBe(11)

        await finishUpload()
        expect(localStorage.getItem(key)).toBe(null)
      })

      it('should store URLs passed in using the uploadUrl option', async () => {
        const file = new Blob('hello world'.split(''))
        const options2 = {
          httpStack: testStack,
          uploadUrl: 'http://tus.io/uploads/storedUrl',
          fingerprint() {},
          onSuccess: waitableFunction('onSuccess'),
          removeFingerprintOnSuccess: true,
        }
        spyOn(options2, 'fingerprint').and.resolveTo('fingerprinted')

        const upload = new Upload(file, options2)
        upload.start()

        expect(options2.fingerprint).toHaveBeenCalled()

        let req = await testStack.nextRequest()
        expect(req.url).toBe('http://tus.io/uploads/storedUrl')
        expect(req.method).toBe('HEAD')
        expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0')

        req.respondWith({
          status: 204,
          responseHeaders: {
            'Upload-Length': '11',
            'Upload-Offset': '3',
          },
        })

        // Wait a short delay to allow the Promises to settle
        await wait(10)

        const key = localStorage.key(0)
        expect(key.indexOf('tus::fingerprinted::')).toBe(0)

        const storedUpload = JSON.parse(localStorage.getItem(key))
        expect(storedUpload.uploadUrl).toBe('http://tus.io/uploads/storedUrl')
        expect(storedUpload.size).toBe(11)

        req = await testStack.nextRequest()
        expect(req.url).toBe('http://tus.io/uploads/storedUrl')
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

        await options2.onSuccess.toBeCalled()

        // Entry in localStorage should be removed after successful upload
        expect(localStorage.getItem(key)).toBe(null)
      })
    })

    it('should delete upload urls on a 4XX', async () => {
      const testStack = new TestHttpStack()
      const file = new Blob('hello world'.split(''))
      const options = {
        httpStack: testStack,
        endpoint: 'http://tus.io/uploads',
        fingerprint() {},
      }
      spyOn(options, 'fingerprint').and.resolveTo('fingerprinted')

      const upload = new Upload(file, options)

      upload.resumeFromPreviousUpload({
        uploadUrl: 'http://tus.io/uploads/resuming',
        urlStorageKey: 'tus::fingerprinted::1337',
      })

      upload.start()

      const req = await testStack.nextRequest()
      expect(req.url).toBe('http://tus.io/uploads/resuming')
      expect(req.method).toBe('HEAD')

      req.respondWith({
        status: 400,
      })

      await wait(10)

      expect(localStorage.getItem('tus::fingerprinted::1337')).toBe(null)
    })

    describe('resolving of URIs', () => {
      // Disable these tests for IE 10 and 11 because it's not possible to overwrite
      // the navigator.product property.
      const isIE = navigator.userAgent.indexOf('Trident/') > 0
      if (isIE) {
        console.log('Skipping tests for React Native in Internet Explorer')
        return
      }

      const originalProduct = navigator.product

      beforeEach(() => {
        jasmine.Ajax.install()
        // Simulate React Native environment to enable URIs as input objects.
        Object.defineProperty(navigator, 'product', {
          value: 'ReactNative',
          configurable: true,
        })
      })

      afterEach(() => {
        jasmine.Ajax.uninstall()
        Object.defineProperty(navigator, 'product', {
          value: originalProduct,
          configurable: true,
        })
      })

      it('should upload a file from an URI', async () => {
        const file = {
          uri: 'file:///my/file.dat',
        }
        const testStack = new TestHttpStack()
        const options = {
          httpStack: testStack,
          endpoint: 'http://tus.io/uploads',
          onSuccess: waitableFunction('onSuccess'),
        }

        const upload = new Upload(file, options)
        upload.start()

        // Wait a short interval to make sure that the XHR has been sent.
        await wait(0)

        let req = jasmine.Ajax.requests.mostRecent()
        expect(req.url).toBe('file:///my/file.dat')
        expect(req.method).toBe('GET')
        expect(req.responseType).toBe('blob')

        req.respondWith({
          status: 200,
          responseHeaders: {
            'Upload-Length': '11',
            'Upload-Offset': '3',
          },
          response: new Blob('hello world'.split('')),
        })

        req = await testStack.nextRequest()
        expect(req.url).toBe('http://tus.io/uploads')
        expect(req.method).toBe('POST')
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
        expect(req.bodySize).toBe(11)

        req.respondWith({
          status: 204,
          responseHeaders: {
            'Upload-Offset': '11',
          },
        })

        await options.onSuccess.toBeCalled()
        expect(upload.url).toBe('http://tus.io/uploads/blargh')
      })

      it("should emit an error if it can't resolve the URI", async () => {
        const file = {
          uri: 'file:///my/file.dat',
        }
        const options = {
          endpoint: 'http://tus.io/uploads',
          onError: waitableFunction('onError'),
        }

        const upload = new Upload(file, options)
        upload.start()

        // Wait a short interval to make sure that the XHR has been sent.
        await wait(0)

        const req = jasmine.Ajax.requests.mostRecent()
        expect(req.url).toBe('file:///my/file.dat')
        expect(req.method).toBe('GET')
        expect(req.responseType).toBe('blob')

        req.responseError()

        await options.onError.toBeCalled()
        expect(options.onError).toHaveBeenCalledWith(
          new Error(
            'tus: cannot fetch `file.uri` as Blob, make sure the uri is correct and accessible. [object Object]',
          ),
        )
      })
    })
  })

  describe('#LocalStorageUrlStorage', () => {
    it('should allow storing and retrieving uploads', async () => {
      await assertUrlStorage(defaultOptions.urlStorage)
    })
  })
})
