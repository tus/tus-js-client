const stream = require('stream')
const temp = require('temp')
const fs = require('fs')
const https = require('https')
const intoStream = require('into-stream')
const tus = require('../..')
const assertUrlStorage = require('./helpers/assertUrlStorage')
const { TestHttpStack, waitableFunction } = require('./helpers/utils')

describe('tus', () => {
  describe('#canStoreURLs', () => {
    it('should be true', () => {
      expect(tus.canStoreURLs).toBe(true)
    })
  })

  describe('#Upload', () => {
    it('should accept Buffers', async () => {
      const buffer = Buffer.from('hello world')
      const options = {
        httpStack: new TestHttpStack(),
        endpoint : '/uploads',
        chunkSize: 7,
      }

      await expectHelloWorldUpload(buffer, options)
    })

    it('should reject streams without specifying the size', async () => {
      const input = new stream.PassThrough()
      const options = {
        endpoint : '/uploads',
        chunkSize: 100,
        onError  : waitableFunction('onError'),
      }

      const upload = new tus.Upload(input, options)
      upload.start()

      const err = await options.onError.toBeCalled
      expect(err.message).toBe("tus: cannot automatically derive upload's size from input. Specify it manually using the `uploadSize` option or use the `uploadLengthDeferred` option")
    })

    it('should reject streams without specifying the chunkSize', async () => {
      const input = new stream.PassThrough()
      const options = {
        endpoint: '/uploads',
        onError : waitableFunction('onError'),
      }

      const upload = new tus.Upload(input, options)
      upload.start()

      const err = await options.onError.toBeCalled
      expect(err.message).toBe('cannot create source for stream without a finite value for the `chunkSize` option; specify a chunkSize to control the memory consumption')
    })

    it('should accept Readable streams', async () => {
      const input = new stream.PassThrough()
      const options = {
        httpStack : new TestHttpStack(),
        endpoint  : '/uploads',
        chunkSize : 7,
        uploadSize: 11,
      }

      input.end('hello WORLD')
      await expectHelloWorldUpload(input, options)
    })

    it('should accept stream-like objects', async () => {
      // This function returns an object that works like a stream but does not inherit stream.Readable
      const input = intoStream('hello WORLD')
      const options = {
        httpStack : new TestHttpStack(),
        endpoint  : '/uploads',
        chunkSize : 7,
        uploadSize: 11,
      }

      await expectHelloWorldUpload(input, options)
    })

    it('should accept Readable streams with deferred size', async () => {
      const input = new stream.PassThrough()
      const options = {
        httpStack           : new TestHttpStack(),
        endpoint            : '/uploads',
        chunkSize           : 7,
        uploadLengthDeferred: true,
      }

      input.end('hello WORLD')
      await expectHelloWorldUpload(input, options)
    })

    it('should accept fs.ReadStream', async () => {
      // Create a temporary file
      const path = temp.path()
      fs.writeFileSync(path, 'hello world')
      const file = fs.createReadStream(path)

      const options = {
        httpStack : new TestHttpStack(),
        endpoint  : '/uploads',
        chunkSize : 7,
        uploadSize: 11,
      }

      await expectHelloWorldUpload(file, options)
    })

    it('should pass through errors from the request', async () => {
      const resErr = new Error('something bad, really!')
      const buffer = Buffer.from('hello world')
      const options = {
        httpStack  : new TestHttpStack(),
        endpoint   : '/uploads',
        onError    : waitableFunction('onError'),
        retryDelays: null,
      }

      const upload = new tus.Upload(buffer, options)
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
      fs.writeFileSync(storagePath, '{"tus::fingerprinted::1337":{"uploadUrl":"http://tus.io/uploads/resuming"}}')
      const storage = new tus.FileUrlStorage(storagePath)
      const input = Buffer.from('hello world')
      const options = {
        httpStack : new TestHttpStack(),
        endpoint  : '/uploads',
        fingerprint () {},
        urlStorage: storage,
        onSuccess : waitableFunction('onSuccess'),
      }
      spyOn(options, 'fingerprint').and.resolveTo('fingerprinted')

      const upload = new tus.Upload(input, options)

      const previousUploads = await upload.findPreviousUploads()
      expect(previousUploads).toEqual([{
        uploadUrl    : 'http://tus.io/uploads/resuming',
        urlStorageKey: 'tus::fingerprinted::1337',
      }])
      upload.resumeFromPreviousUpload(previousUploads[0])

      upload.start()

      expect(options.fingerprint).toHaveBeenCalledWith(input, upload.options)

      let req = await options.httpStack.nextRequest()
      expect(req.url).toBe('http://tus.io/uploads/resuming')
      expect(req.method).toBe('HEAD')
      expect(req.requestHeaders['Tus-Resumable']).toBe('1.0.0')

      req.respondWith({
        status         : 204,
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
      expect(req.requestHeaders['Upload-Offset']).toBe(3)
      expect(req.requestHeaders['Content-Type']).toBe('application/offset+octet-stream')
      expect(req.body.size).toBe(11 - 3)

      req.respondWith({
        status         : 204,
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
      const storage = new tus.FileUrlStorage(storagePath)
      await assertUrlStorage(storage)
    })
  })

  describe('#NodeHttpStack', () => {
    it("should allow to pass options to Node's requests", async () => {
      const customAgent = new https.Agent()
      const stack = (new tus.HttpStack({
        agent: customAgent,
      }))
      const req = stack.createRequest('GET', 'https://tusd.tusdemo.net/')
      await req.send()
      expect(req.getUnderlyingObject().agent).toBe(customAgent)
      expect(req.getUnderlyingObject().agent).not.toBe(https.globalAgent)
    })
  })

  describe('#StreamSource', () => {
    it('should slice at different ranges', async () => {
      const input = stream.Readable.from(Buffer.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ'), {
        objectMode: false,
      })
      const source = new tus.StreamSource(input)

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
      await expectAsync(ret).toBeRejectedWithError('cannot slice from position which we already seeked away')

      // Error case: start is is outside of buffer
      ret = source.slice(50, 100)
      await expectAsync(ret).toBeRejectedWithError('slice start is outside of buffer (currently not implemented)')

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
      const source = new tus.StreamSource(input)

      const ret = source.slice(0, 10)
      await expectAsync(ret).toBeRejected({ code: 'ERR_STREAM_NULL_VALUES' })
    })
  })
})

async function getBodySize (body) {
  if (body == null) {
    return 0
  }

  if (body.size != null) {
    return body.size
  }

  return new Promise((resolve) => {
    body.on('readable', () => {
      let chunk
      while ((chunk = body.read()) !== null) {
        resolve(chunk.length)
      }
    })
  })
}

async function expectHelloWorldUpload (input, options) {
  options.httpStack = new TestHttpStack()
  options.onSuccess = waitableFunction('onSuccess')

  const upload = new tus.Upload(input, options)
  upload.start()

  let req = await options.httpStack.nextRequest()
  expect(req.url).toBe('/uploads')
  expect(req.method).toBe('POST')
  if (options.uploadLengthDeferred) {
    expect(req.requestHeaders['Upload-Length']).toBe(undefined)
    expect(req.requestHeaders['Upload-Defer-Length']).toBe(1)
  } else {
    expect(req.requestHeaders['Upload-Length']).toBe(11)
    expect(req.requestHeaders['Upload-Defer-Length']).toBe(undefined)
  }

  req.respondWith({
    status         : 201,
    responseHeaders: {
      Location: '/uploads/blargh',
    },
  })

  req = await options.httpStack.nextRequest()
  expect(req.url).toBe('/uploads/blargh')
  expect(req.method).toBe('PATCH')
  expect(req.requestHeaders['Upload-Offset']).toBe(0)
  expect(await getBodySize(req.body)).toBe(7)

  req.respondWith({
    status         : 204,
    responseHeaders: {
      'Upload-Offset': 7,
    },
  })

  req = await options.httpStack.nextRequest()
  expect(req.url).toBe('/uploads/blargh')
  expect(req.method).toBe('PATCH')
  expect(req.requestHeaders['Upload-Offset']).toBe(7)

  if (options.uploadLengthDeferred) {
    expect(req.requestHeaders['Upload-Length']).toBe(11)
  }

  expect(await getBodySize(req.body)).toBe(4)
  req.respondWith({
    status         : 204,
    responseHeaders: {
      'Upload-Offset': 11,
    },
  })

  await options.onSuccess.toBeCalled
}
