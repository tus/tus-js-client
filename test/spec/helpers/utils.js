/**
 * Helper function to create a Blob from a string.
 */
export function getBlob(str) {
  return new Blob(str.split(''))
}

/**
 * Helper function to create a Blob of a specific size filled with repeated content.
 * Works in both Node.js and browser environments.
 */
export function getLargeBlob(sizeInBytes) {
  // Use a pattern that's easy to verify and compresses well
  const pattern = 'abcdefghij' // 10 bytes
  const chunkSize = 1024 * 1024 // 1 MB chunks to avoid memory issues
  const chunks = []

  let bytesWritten = 0
  while (bytesWritten < sizeInBytes) {
    const currentChunkSize = Math.min(chunkSize, sizeInBytes - bytesWritten)

    // Calculate where we are in the pattern for this chunk
    const startOffset = bytesWritten % pattern.length

    // Build the chunk content efficiently
    // Create a shifted pattern that starts at the correct offset
    const shiftedPattern = pattern.substring(startOffset) + pattern.substring(0, startOffset)
    const fullRepetitions = Math.floor(currentChunkSize / pattern.length)
    const remainder = currentChunkSize % pattern.length
    const chunk = shiftedPattern.repeat(fullRepetitions) + shiftedPattern.substring(0, remainder)

    chunks.push(chunk)
    bytesWritten += currentChunkSize
  }

  // In browser, Blob constructor is native
  // In Node.js (when using test environment), Blob is also available
  return new Blob(chunks)
}

/**
 * Helper function to create a ReadableStream that streams data piece by piece.
 * This emulates a real streaming source and works in both Node.js and browser environments.
 * @param {number} sizeInBytes - Total size of data to stream
 * @param {number} streamChunkSize - Size of each chunk to stream (default 1 MB)
 * @returns {ReadableStream} A readable stream that yields the data in chunks
 */
export function createStreamingSource(sizeInBytes, streamChunkSize = 1024 * 1024) {
  const pattern = 'abcdefghij' // 10 bytes
  let bytesStreamed = 0

  return new ReadableStream({
    pull(controller) {
      if (bytesStreamed >= sizeInBytes) {
        controller.close()
        return
      }

      const currentChunkSize = Math.min(streamChunkSize, sizeInBytes - bytesStreamed)

      // Calculate where we are in the pattern for this chunk
      const startOffset = bytesStreamed % pattern.length

      // Build the chunk content efficiently
      const shiftedPattern = pattern.substring(startOffset) + pattern.substring(0, startOffset)
      const fullRepetitions = Math.floor(currentChunkSize / pattern.length)
      const remainder = currentChunkSize % pattern.length
      const chunk = shiftedPattern.repeat(fullRepetitions) + shiftedPattern.substring(0, remainder)

      // Convert to Uint8Array for streaming
      const encoder = new TextEncoder()
      const data = encoder.encode(chunk)

      controller.enqueue(data)
      bytesStreamed += currentChunkSize
    },
  })
}

// The public demo server closes or stalls connections while CI downloads the
// uploaded 50 MiB object. Bound each attempt so a hang can be retried inside
// the spec timeout.
const VALIDATION_RETRY_DELAYS = [0, 1000, 3000]
const VALIDATION_ATTEMPT_TIMEOUT_MS = 45_000

function isTransientNetworkError(err) {
  if (!(err instanceof Error)) return false
  if (err.name === 'TimeoutError' || err.name === 'AbortError') return true
  const message = `${err.name} ${err.message} ${err.cause ?? ''}`
  return /terminated|failed to fetch|other side closed|ECONNRESET|ECONNREFUSED|ETIMEDOUT|UND_ERR_SOCKET|fetch failed|error reading a body|networkerror|timeout/i.test(
    message,
  )
}

async function fetchAndRead(url, options, readBody) {
  for (let attempt = 0; attempt < VALIDATION_RETRY_DELAYS.length; attempt++) {
    if (VALIDATION_RETRY_DELAYS[attempt] > 0) {
      await wait(VALIDATION_RETRY_DELAYS[attempt])
    }

    try {
      const res = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(VALIDATION_ATTEMPT_TIMEOUT_MS),
      })
      const body = readBody ? await readBody(res) : undefined
      return { res, body }
    } catch (err) {
      if (!isTransientNetworkError(err) || attempt === VALIDATION_RETRY_DELAYS.length - 1) {
        throw err
      }
    }
  }

  throw new Error('tus: validation request was not sent')
}

/**
 * Validate that uploaded content matches the original blob.
 * Downloads the entire file and compares it against the original.
 * @param {Object} upload - The upload object with URL
 * @param {Blob} originalBlob - The original blob that was uploaded
 * @returns {Promise<Object>} Promise that resolves to the upload object
 */
export async function validateUploadContent(upload, originalBlob) {
  // Download and validate the entire uploaded file against the original blob
  const [{ res, body: downloadedContent }, originalContent] = await Promise.all([
    fetchAndRead(upload.url, undefined, (response) => response.text()),
    originalBlob.text(),
  ])

  expect(res.status).toBe(200)
  // Verify the file size matches
  expect(downloadedContent.length).toBe(originalContent.length)
  // Validate that the downloaded content matches the original blob
  expect(downloadedContent).toBe(originalContent)

  return upload
}

/**
 * Validate upload metadata by checking headers.
 * @param {Object} upload - The upload object with URL
 * @param {number} expectedSize - Expected file size in bytes
 * @returns {Promise<Object>} Promise that resolves to the upload object
 */
export async function validateUploadMetadata(upload, expectedSize) {
  const { res, body } = await fetchAndRead(
    upload.url,
    {
      method: 'HEAD',
      headers: {
        'Tus-Resumable': '1.0.0',
      },
    },
    (response) => response.text(),
  )

  expect(res.status).toBe(200)
  expect(res.headers.get('tus-resumable')).toBe('1.0.0')
  expect(res.headers.get('upload-offset')).toBe(String(expectedSize))
  expect(res.headers.get('upload-length')).toBe(String(expectedSize))

  // The values in the Upload-Metadata header may not be in the same
  // order as we submitted them (the specification does not require
  // that). Therefore, we split the values and verify that each one
  // is present.
  const metadataStr = res.headers.get('upload-metadata')
  expect(metadataStr).toBeTruthy()
  const metadata = metadataStr.split(',')
  expect(metadata).toContain('filename bGFyZ2UtZmlsZS50eHQ=')
  expect(metadata).toContain('filetype dGV4dC9wbGFpbg==')
  expect(metadata).toContain('nonlatin c8WCb8WEY2U=')
  expect(metadata).toContain('number MTAw')
  expect(metadata.length).toBe(4)
  expect(body).toBe('')

  return upload
}

/**
 * Validate that upload was deleted by checking for 404.
 * @param {Object} upload - The upload object with URL
 * @returns {Promise<Object>} Promise that resolves to the upload object
 */
export async function validateUploadDeletion(upload) {
  const { res } = await fetchAndRead(upload.url)
  expect(res.status).toBe(404)

  return upload
}

/**
 * Create a promise and obtain the resolve/reject functions
 * outside of the Promise callback.
 */
function flatPromise() {
  let resolveFn
  let rejectFn
  const p = new Promise((resolve, reject) => {
    resolveFn = resolve
    rejectFn = reject
  })

  return [p, resolveFn, rejectFn]
}

/**
 * Create a spy-able function which resolves a Promise
 * once it is called.
 */
export function waitableFunction(name = 'func') {
  const [promise, resolve] = flatPromise()
  const fn = jasmine.createSpy(name, resolve).and.callThrough()

  fn.toBeCalled = () => promise
  return fn
}

/**
 * Create a Promise that resolves after the specified duration.
 */
export function wait(delay) {
  return new Promise((resolve) => {
    setTimeout(resolve, delay, 'timed out')
  })
}

/**
 * TestHttpStack implements the HTTP stack interface for tus-js-client
 * and can be used to assert outgoing requests and respond with mock data.
 */
export class TestHttpStack {
  constructor() {
    this._pendingRequests = []
    this._pendingWaits = []
  }

  createRequest(method, url) {
    return new TestRequest(method, url, (req) => {
      if (this._pendingWaits.length >= 1) {
        const handler = this._pendingWaits.shift()
        handler(req)
        return
      }

      this._pendingRequests.push(req)
    })
  }

  nextRequest() {
    if (this._pendingRequests.length >= 1) {
      return Promise.resolve(this._pendingRequests.shift())
    }

    return new Promise((resolve) => {
      this._pendingWaits.push(resolve)
    })
  }
}

export class TestRequest {
  constructor(method, url, onRequestSend) {
    this.method = method
    this.url = url
    this.requestHeaders = {}
    this.body = null
    this.bodySize = null

    this._onRequestSend = onRequestSend
    this._onProgress = () => {}
    ;[this._requestPromise, this._resolveRequest, this._rejectRequest] = flatPromise()
  }

  getMethod() {
    return this.method
  }

  getURL() {
    return this.url
  }

  setHeader(header, value) {
    this.requestHeaders[header] = value
  }

  getHeader(header) {
    return this.requestHeaders[header] || null
  }

  setProgressHandler(progressHandler) {
    this._onProgress = progressHandler
  }

  async send(body = null) {
    this.body = body

    if (body) {
      this.bodySize = await getBodySize(body)

      this._onProgress(0)
      this._onProgress(this.bodySize)
    }

    this._onRequestSend(this)
    return this._requestPromise
  }

  abort() {
    this._rejectRequest(new Error('request aborted'))
  }

  getUnderlyingObject() {
    throw new Error('not implemented')
  }

  respondWith(resData) {
    resData.responseHeaders = resData.responseHeaders || {}

    const res = new TestResponse(resData)
    this._resolveRequest(res)
  }

  responseError(err) {
    this._rejectRequest(err)
  }
}

function getBodySize(body) {
  if (body == null) {
    return null
  }

  if (
    body instanceof ArrayBuffer ||
    (typeof SharedArrayBuffer !== 'undefined' && body instanceof SharedArrayBuffer) ||
    ArrayBuffer.isView(body)
  ) {
    return body.byteLength
  }

  if (body instanceof Blob) {
    return body.size
  }

  if (body.length != null) {
    return body.length
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

export class TestResponse {
  constructor(res) {
    this._response = res
  }

  getStatus() {
    return this._response.status
  }

  getHeader(header) {
    return this._response.responseHeaders[header]
  }

  getBody() {
    return this._response.responseText
  }

  getUnderlyingObject() {
    throw new Error('not implemented')
  }
}
