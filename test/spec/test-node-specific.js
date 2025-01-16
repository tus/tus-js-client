import crypto from 'crypto'
import { once } from 'events'
import fs from 'fs'
import http from 'http'
import https from 'https'
import stream from 'stream'
import intoStream from 'into-stream'
import temp from 'temp'
import { Upload, canStoreURLs } from 'tus-js-client'
import { FileUrlStorage } from 'tus-js-client/node/FileUrlStorage'
import { NodeHttpStack } from 'tus-js-client/node/NodeHttpStack'
import { StreamFileSource } from 'tus-js-client/node/sources/StreamFileSource'
import { assertUrlStorage } from './helpers/assertUrlStorage.js'
import { TestHttpStack, waitableFunction } from './helpers/utils.js'

describe('tus', () => {
  describe('#canStoreURLs', () => {
    it('should be true', () => {
      expect(canStoreURLs).toBe(true)
    })
  })

  describe('#Upload', () => {
    it('should accept Buffers', async () => {
      const buffer = Buffer.from('hello world')
      const options = {
        httpStack: new TestHttpStack(),
        endpoint: '/uploads',
        chunkSize: 7,
      }

      await expectHelloWorldUpload(buffer, options)
    })

    describe('uploading from a stream', () => {
      it('should reject streams without specifying the size', async () => {
        const input = new stream.PassThrough()
        const options = {
          endpoint: '/uploads',
          chunkSize: 100,
          onError: waitableFunction('onError'),
        }

        const upload = new Upload(input, options)
        upload.start()

        const err = await options.onError.toBeCalled
        expect(err.message).toBe(
          "tus: cannot automatically derive upload's size from input. Specify it manually using the `uploadSize` option or use the `uploadLengthDeferred` option",
        )
      })

      it('should reject streams without specifying the chunkSize', async () => {
        const input = new stream.PassThrough()
        const options = {
          endpoint: '/uploads',
          onError: waitableFunction('onError'),
        }

        const upload = new Upload(input, options)
        upload.start()

        const err = await options.onError.toBeCalled
        expect(err.message).toBe(
          'cannot create source for stream without a finite value for the `chunkSize` option; specify a chunkSize to control the memory consumption',
        )
      })

      it('should accept Readable streams', async () => {
        const input = new stream.PassThrough()
        const options = {
          httpStack: new TestHttpStack(),
          endpoint: '/uploads',
          chunkSize: 7,
          uploadSize: 11,
        }

        input.end('hello WORLD')
        await expectHelloWorldUpload(input, options)
      })

      it('should accept stream-like objects', async () => {
        // This function returns an object that works like a stream but does not inherit stream.Readable
        const input = intoStream('hello WORLD')
        const options = {
          httpStack: new TestHttpStack(),
          endpoint: '/uploads',
          chunkSize: 7,
          uploadSize: 11,
        }

        await expectHelloWorldUpload(input, options)
      })

      it('should accept Readable streams with deferred size', async () => {
        const input = new stream.PassThrough()
        const options = {
          httpStack: new TestHttpStack(),
          endpoint: '/uploads',
          chunkSize: 7,
          uploadLengthDeferred: true,
        }

        input.end('hello WORLD')
        await expectHelloWorldUpload(input, options)
      })

      it('should throw an error if the source provides less data than uploadSize', async () => {
        const input = new stream.PassThrough()
        input.end('hello world')

        const testStack = new TestHttpStack()
        const options = {
          httpStack: testStack,
          uploadSize: 100,
          chunkSize: 100,
          endpoint: 'http://tus.io/uploads',
          retryDelays: [],
          onError: waitableFunction('onError'),
        }

        const upload = new Upload(input, options)
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

    describe('uploading from a fs.ReadStream', () => {
      it('should accept fs.ReadStream', async () => {
        // Create a temporary file
        const path = temp.path()
        fs.writeFileSync(path, 'hello world')
        const file = fs.createReadStream(path)

        const options = {
          httpStack: new TestHttpStack(),
          endpoint: '/uploads',
          chunkSize: 7,
        }

        await expectHelloWorldUpload(file, options)
      })

      it('should support parallelUploads and fs.ReadStream', async () => {
        // Create a temporary file
        const path = temp.path()
        fs.writeFileSync(path, 'hello world')
        const file = fs.createReadStream(path)

        const testStack = new TestHttpStack()

        const options = {
          httpStack: testStack,
          parallelUploads: 2,
          endpoint: 'https://tus.io/uploads',
          onProgress() {},
          onSuccess: waitableFunction(),
        }
        spyOn(options, 'onProgress')

        const upload = new Upload(file, options)
        upload.start()

        let req = await testStack.nextRequest()
        expect(req.url).toBe('https://tus.io/uploads')
        expect(req.method).toBe('POST')
        expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0')
        expect(req.requestHeaders['Upload-Length']).toBe('5')
        expect(req.requestHeaders['Upload-Concat']).toBe('partial')

        req.respondWith({
          status: 201,
          responseHeaders: {
            Location: 'https://tus.io/uploads/upload1',
          },
        })

        req = await testStack.nextRequest()
        expect(req.url).toBe('https://tus.io/uploads/upload1')
        expect(req.method).toBe('PATCH')
        expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0')
        expect(req.requestHeaders['Upload-Offset']).toBe('0')
        expect(req.requestHeaders['Content-Type']).toBe('application/offset+octet-stream')
        expect(req.body.size).toBe(5)

        req.respondWith({
          status: 204,
          responseHeaders: {
            'Upload-Offset': 5,
          },
        })

        req = await testStack.nextRequest()
        expect(req.url).toBe('https://tus.io/uploads')
        expect(req.method).toBe('POST')
        expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0')
        expect(req.requestHeaders['Upload-Length']).toBe('6')
        expect(req.requestHeaders['Upload-Concat']).toBe('partial')

        req.respondWith({
          status: 201,
          responseHeaders: {
            Location: 'https://tus.io/uploads/upload2',
          },
        })

        req = await testStack.nextRequest()
        expect(req.url).toBe('https://tus.io/uploads/upload2')
        expect(req.method).toBe('PATCH')
        expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0')
        expect(req.requestHeaders['Upload-Offset']).toBe('0')
        expect(req.requestHeaders['Content-Type']).toBe('application/offset+octet-stream')
        expect(req.body.size).toBe(6)

        req.respondWith({
          status: 204,
          responseHeaders: {
            'Upload-Offset': 6,
          },
        })

        req = await testStack.nextRequest()
        expect(req.url).toBe('https://tus.io/uploads')
        expect(req.method).toBe('POST')
        expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0')
        expect(req.requestHeaders['Upload-Length']).toBeUndefined()
        expect(req.requestHeaders['Upload-Concat']).toBe(
          'final;https://tus.io/uploads/upload1 https://tus.io/uploads/upload2',
        )

        req.respondWith({
          status: 201,
          responseHeaders: {
            Location: 'https://tus.io/uploads/upload3',
          },
        })

        await options.onSuccess.toBeCalled

        expect(upload.url).toBe('https://tus.io/uploads/upload3')
        expect(options.onProgress).toHaveBeenCalledWith(5, 11)
        expect(options.onProgress).toHaveBeenCalledWith(11, 11)
      })

      it('should throw an error if the source provides less data than uploadSize', async () => {
        // Create a temporary file
        const path = temp.path()
        fs.writeFileSync(path, 'hello world')
        const file = fs.createReadStream(path)

        const testStack = new TestHttpStack()
        const options = {
          httpStack: testStack,
          uploadSize: 100,
          chunkSize: 100,
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

        const err = await options.onError.toBeCalled
        expect(err.message).toBe(
          'tus: failed to upload chunk at offset 0, caused by Error: upload was configured with a size of 100 bytes, but the source is done after 11 bytes, originated from request (method: PATCH, url: http://tus.io/uploads/foo, response code: n/a, response text: n/a, request id: n/a)',
        )
      })
    })

    it('should pass through errors from the request', async () => {
      const resErr = new Error('something bad, really!')
      const buffer = Buffer.from('hello world')
      const options = {
        httpStack: new TestHttpStack(),
        endpoint: '/uploads',
        onError: waitableFunction('onError'),
        retryDelays: null,
      }

      const upload = new Upload(buffer, options)
      upload.start()

      const req = await options.httpStack.nextRequest()
      expect(req.url).toBe('/uploads')
      expect(req.method).toBe('POST')

      req.responseError(resErr)

      const err = await options.onError.toBeCalled
      expect(err.causingError).toBe(resErr)
    })

    it('should resume an upload from a stored url', async () => {
      const storagePath = temp.path()
      fs.writeFileSync(
        storagePath,
        '{"tus::fingerprinted::1337":{"uploadUrl":"http://tus.io/uploads/resuming"}}',
      )
      const storage = new FileUrlStorage(storagePath)
      const input = Buffer.from('hello world')
      const options = {
        httpStack: new TestHttpStack(),
        endpoint: '/uploads',
        fingerprint() {},
        urlStorage: storage,
        onSuccess: waitableFunction('onSuccess'),
      }
      spyOn(options, 'fingerprint').and.resolveTo('fingerprinted')

      const upload = new Upload(input, options)

      const previousUploads = await upload.findPreviousUploads()
      expect(previousUploads).toEqual([
        {
          uploadUrl: 'http://tus.io/uploads/resuming',
          urlStorageKey: 'tus::fingerprinted::1337',
        },
      ])
      upload.resumeFromPreviousUpload(previousUploads[0])

      upload.start()

      expect(options.fingerprint).toHaveBeenCalledWith(input, upload.options)

      let req = await options.httpStack.nextRequest()
      expect(req.url).toBe('http://tus.io/uploads/resuming')
      expect(req.method).toBe('HEAD')
      expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0')

      req.respondWith({
        status: 204,
        responseHeaders: {
          'Upload-Length': 11,
          'Upload-Offset': 3,
        },
      })

      expect(upload.url).toBe('http://tus.io/uploads/resuming')

      req = await options.httpStack.nextRequest()
      expect(req.url).toBe('http://tus.io/uploads/resuming')
      expect(req.method).toBe('PATCH')
      expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0')
      expect(req.requestHeaders['Upload-Offset']).toBe('3')
      expect(req.requestHeaders['Content-Type']).toBe('application/offset+octet-stream')
      expect(req.body.size).toBe(11 - 3)

      req.respondWith({
        status: 204,
        responseHeaders: {
          'Upload-Offset': 11,
        },
      })

      await options.onSuccess.toBeCalled
    })
  })

  describe('#FileUrlStorage', () => {
    it('should allow storing and retrieving uploads', async () => {
      const storagePath = temp.path()
      const storage = new FileUrlStorage(storagePath)
      await assertUrlStorage(storage)
    })
  })

  describe('#NodeHttpStack', () => {
    it("should allow to pass options to Node's requests", async () => {
      const customAgent = new https.Agent()
      const stack = new NodeHttpStack({
        agent: customAgent,
      })
      const req = stack.createRequest('GET', 'https://tusd.tusdemo.net/')
      await req.send()
      expect(req.getUnderlyingObject().agent).toBe(customAgent)
      expect(req.getUnderlyingObject().agent).not.toBe(https.globalAgent)
    })

    it('should emit progress events when sending a Buffer', async () => {
      // Start a simple HTTP server on a random port that accepts POST requests.
      const server = http.createServer((req, res) => {
        if (req.method === 'POST') {
          req.on('data', () => {})
          req.on('end', () => {
            res.writeHead(200)
            res.end('Data received')
          })
        } else {
          res.writeHead(404)
          res.end('Not found')
        }
      })

      server.listen(0)
      await once(server, 'listening')
      const { port } = server.address()

      const progressEvents = []

      // Send POST request with 20MB of random data
      const randomData = crypto.randomBytes(20 * 1024 * 1024)
      const stack = new NodeHttpStack({})
      const req = stack.createRequest('POST', `http://localhost:${port}`)
      req.setProgressHandler((bytesSent) => progressEvents.push(bytesSent))
      await req.send(randomData)

      server.close()

      // We should have received progress events and at least one event should not be for 0% or 100%.
      expect(progressEvents.length).toBeGreaterThan(0)
      expect(
        progressEvents.some((bytesSent) => bytesSent !== 0 && bytesSent !== randomData.length),
      ).toBeTrue()
    })
  })

  describe('#StreamFileSource', () => {
    it('should slice at different ranges', async () => {
      const input = stream.Readable.from(Buffer.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ'), {
        objectMode: false,
      })
      const source = new StreamFileSource(input)

      // Read all data from stream
      let ret = await source.slice(0, 10)
      expect(ret.done).toBe(false)
      expect(ret.value.toString()).toBe('ABCDEFGHIJ')

      // Read data from buffer only
      ret = await source.slice(5, 10)
      expect(ret.done).toBe(false)
      expect(ret.value.toString()).toBe('FGHIJ')

      // Read data from buffer and new data from stream
      ret = await source.slice(5, 15)
      expect(ret.done).toBe(false)
      expect(ret.value.toString()).toBe('FGHIJKLMNO')

      // Error case: start is before previous start
      ret = source.slice(0, 100)
      await expectAsync(ret).toBeRejectedWithError(
        'cannot slice from position which we already seeked away',
      )

      // Error case: start is is outside of buffer
      ret = source.slice(50, 100)
      await expectAsync(ret).toBeRejectedWithError(
        'slice start is outside of buffer (currently not implemented)',
      )

      // Read remaining data from stream
      ret = await source.slice(15, 100)
      expect(ret.done).toBe(true)
      expect(ret.value.toString()).toBe('PQRSTUVWXYZ')

      // Read remaining data from buffer
      ret = await source.slice(20, 100)
      expect(ret.done).toBe(true)
      expect(ret.value.toString()).toBe('UVWXYZ')
    })

    it('should pass through errors', async () => {
      // Null as an element in the array causes the stream to emit an error when trying
      // to read. This error should be passed to the caller.
      const input = stream.Readable.from([null])
      const source = new StreamFileSource(input)

      const ret = source.slice(0, 10)
      await expectAsync(ret).toBeRejected({ code: 'ERR_STREAM_NULL_VALUES' })
    })
  })
})

async function getBodySize(body) {
  if (body == null) {
    return 0
  }

  if (body.size != null) {
    return body.size
  }

  return new Promise((resolve) => {
    body.on('readable', () => {
      while (true) {
        const chunk = body.read()
        if (chunk == null) break

        resolve(chunk.length)
      }
    })
  })
}

async function expectHelloWorldUpload(input, options) {
  options.httpStack = new TestHttpStack()
  options.onSuccess = waitableFunction('onSuccess')

  const upload = new Upload(input, options)
  upload.start()

  let req = await options.httpStack.nextRequest()
  expect(req.url).toBe('/uploads')
  expect(req.method).toBe('POST')
  if (options.uploadLengthDeferred) {
    expect(req.requestHeaders['Upload-Length']).toBe(undefined)
    expect(req.requestHeaders['Upload-Defer-Length']).toBe('1')
  } else {
    expect(req.requestHeaders['Upload-Length']).toBe('11')
    expect(req.requestHeaders['Upload-Defer-Length']).toBe(undefined)
  }

  req.respondWith({
    status: 201,
    responseHeaders: {
      Location: '/uploads/blargh',
    },
  })

  req = await options.httpStack.nextRequest()
  expect(req.url).toBe('/uploads/blargh')
  expect(req.method).toBe('PATCH')
  expect(req.requestHeaders['Upload-Offset']).toBe('0')
  expect(await getBodySize(req.body)).toBe(7)

  req.respondWith({
    status: 204,
    responseHeaders: {
      'Upload-Offset': 7,
    },
  })

  req = await options.httpStack.nextRequest()
  expect(req.url).toBe('/uploads/blargh')
  expect(req.method).toBe('PATCH')
  expect(req.requestHeaders['Upload-Offset']).toBe('7')

  if (options.uploadLengthDeferred) {
    expect(req.requestHeaders['Upload-Length']).toBe('11')
  }

  expect(await getBodySize(req.body)).toBe(4)
  req.respondWith({
    status: 204,
    responseHeaders: {
      'Upload-Offset': 11,
    },
  })

  await options.onSuccess.toBeCalled
}
