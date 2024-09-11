// The url.parse method is superseeded by the url.URL constructor,
// but it is still included in Node.js
import * as http from 'http'
import * as https from 'https'
import { Readable, Transform } from 'stream'
import { parse } from 'url'
import throttle from 'lodash.throttle'

export default class NodeHttpStack {
  constructor(requestOptions = {}) {
    this._requestOptions = requestOptions
  }

  createRequest(method, url) {
    return new Request(method, url, this._requestOptions)
  }

  getName() {
    return 'NodeHttpStack'
  }
}

class Request {
  constructor(method, url, options) {
    this._method = method
    this._url = url
    this._headers = {}
    this._request = null
    this._progressHandler = () => {}
    this._requestOptions = options || {}
  }

  getMethod() {
    return this._method
  }

  getURL() {
    return this._url
  }

  setHeader(header, value) {
    this._headers[header] = value
  }

  getHeader(header) {
    return this._headers[header]
  }

  setProgressHandler(progressHandler) {
    this._progressHandler = progressHandler
  }

  send(body = null) {
    return new Promise((resolve, reject) => {
      const options = {
        ...parse(this._url),
        ...this._requestOptions,

        method: this._method,
        headers: {
          ...(this._requestOptions.headers || {}),
          ...this._headers,
        },
      }

      if (body?.size) {
        options.headers['Content-Length'] = body.size
      }

      const httpModule = options.protocol === 'https:' ? https : http
      this._request = httpModule.request(options)
      const req = this._request
      req.on('response', (res) => {
        const resChunks = []
        res.on('data', (data) => {
          resChunks.push(data)
        })

        res.on('end', () => {
          const responseText = Buffer.concat(resChunks).toString('utf8')
          resolve(new Response(res, responseText))
        })
      })

      req.on('error', (err) => {
        reject(err)
      })

      if (body instanceof Readable) {
        // Readable stream are piped through a PassThrough instance, which
        // counts the number of bytes passed through. This is used, for example,
        // when an fs.ReadStream is provided to tus-js-client.
        body.pipe(new ProgressEmitter(this._progressHandler)).pipe(req)
      } else if (body instanceof Uint8Array) {
        // For Buffers and Uint8Arrays (in Node.js all buffers are instances of Uint8Array),
        // we write chunks of the buffer to the stream and use that to track the progress.
        // This is used when either a Buffer or a normal readable stream is provided
        // to tus-js-client.
        writeBufferToStreamWithProgress(req, body, this._progressHandler)
      } else {
        req.end(body)
      }
    })
  }

  abort() {
    if (this._request !== null) this._request.abort()
    return Promise.resolve()
  }

  getUnderlyingObject() {
    return this._request
  }
}

class Response {
  constructor(res, body) {
    this._response = res
    this._body = body
  }

  getStatus() {
    return this._response.statusCode
  }

  getHeader(header) {
    return this._response.headers[header.toLowerCase()]
  }

  getBody() {
    return this._body
  }

  getUnderlyingObject() {
    return this._response
  }
}

// ProgressEmitter is a simple PassThrough-style transform stream which keeps
// track of the number of bytes which have been piped through it and will
// invoke the `onprogress` function whenever new number are available.
class ProgressEmitter extends Transform {
  constructor(onprogress) {
    super()

    // The _onprogress property will be invoked, whenever a chunk is piped
    // through this transformer. Since chunks are usually quite small (64kb),
    // these calls can occur frequently, especially when you have a good
    // connection to the remote server. Therefore, we are throtteling them to
    // prevent accessive function calls.
    this._onprogress = throttle(onprogress, 100, {
      leading: true,
      trailing: false,
    })
    this._position = 0
  }

  _transform(chunk, _encoding, callback) {
    this._position += chunk.length
    this._onprogress(this._position)
    callback(null, chunk)
  }
}

// writeBufferToStreamWithProgress writes chunks from `source` (either a
// Buffer or Uint8Array) to the readable stream `stream`.
// The size of the chunk depends on the stream's highWaterMark to fill the
// stream's internal buffer as best as possible.
// If the internal buffer is full, the callback `onprogress` will be invoked
// to notify about the write progress. Writing will be resumed once the internal
// buffer is empty, as indicated by the emitted `drain` event.
// See https://nodejs.org/docs/latest/api/stream.html#buffering for more details
// on the buffering behavior of streams.
const writeBufferToStreamWithProgress = (stream, source, onprogress) => {
  onprogress = throttle(onprogress, 100, {
    leading: true,
    trailing: false,
  })

  let offset = 0

  function writeNextChunk() {
    // Take at most the amount of bytes from highWaterMark. This should fill the streams
    // internal buffer already.
    const chunkSize = Math.min(stream.writableHighWaterMark, source.length - offset)

    // Note: We use subarray instead of slice because it works without copying data for
    // Buffers and Uint8Arrays.
    const chunk = source.subarray(offset, offset + chunkSize)
    offset += chunk.length

    // `write` returns true if the internal buffer is not full and we should write more.
    // If the stream is destroyed because the request is aborted, it will return false
    // and no 'drain' event is emitted, so won't continue writing data.
    const canContinue = stream.write(chunk)

    if (!canContinue) {
      // If the buffer is full, wait for the 'drain' event to write more data.
      stream.once('drain', writeNextChunk)
      onprogress(offset)
    } else if (offset < source.length) {
      // If there's still data to write and the buffer is not full, write next chunk.
      writeNextChunk()
    } else {
      // If all data has been written, close the stream if needed, and emit a 'finish' event.
      stream.end()
    }
  }

  // Start writing the first chunk.
  writeNextChunk()
}
