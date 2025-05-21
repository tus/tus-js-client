import { Upload } from 'tus-js-client'
import { TestHttpStack, waitableFunction } from './helpers/utils.js'

describe('tus', () => {
  describe('#Upload', () => {
    const cases = [
      {
        name: 'ArrayBuffer',
        get: () => new TextEncoder().encode('Hello, world!').buffer,
        check: (val) => val instanceof ArrayBuffer,
      },
      {
        name: 'Uint8Array',
        get: () => new TextEncoder().encode('Hello, world!'),
        check: (val) => val instanceof Uint8Array,
      },
      {
        name: 'DataView',
        // DataView does not cover the whole buffer and tus-js-client should respect that.
        get: () => new DataView(new TextEncoder().encode('XXXHello, world!XXX').buffer, 3, 13),
        check: (val) => ArrayBuffer.isView(val),
      },
      {
        name: 'Blob',
        get: () => new Blob(['Hello, world!'], { type: 'text/plain' }),
        check: (val) => val instanceof Blob,
      },
    ]

    for (const { name, get, check } of cases) {
      it(`should upload from a(n) ${name}`, async () => {
        const value = get()
        if (!check(value)) {
          throw new Error(`Value is not a(n) ${name}, but ${value} instead`)
        }

        const testStack = new TestHttpStack()
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

        const upload = new Upload(value, options)
        upload.start()

        let req = await testStack.nextRequest()
        expect(req.url).toBe('http://tus.io/uploads')
        expect(req.method).toBe('POST')
        expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0')
        expect(req.requestHeaders['Upload-Length']).toBe('13')

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
        expect(req.bodySize).toBe(6)

        req.respondWith({
          status: 204,
          responseHeaders: {
            'Upload-Offset': '13',
          },
        })

        await options.onSuccess.toBeCalled()

        expect(upload.url).toBe('http://tus.io/uploads/blargh')
        expect(options.onProgress).toHaveBeenCalledWith(13, 13)
        expect(options.onChunkComplete).toHaveBeenCalledWith(7, 7, 13)
        expect(options.onChunkComplete).toHaveBeenCalledWith(6, 13, 13)
      })
    }
  })
})
