import { FetchHttpStack } from 'tus-js-client/browser/FetchHttpStack'

// A fetch stub that never settles on its own, but honours the abort signal the
// same way the real Fetch API does. Needed to exercise FetchRequest#abort.
function hangingFetch(_url, options) {
  return new Promise((_resolve, reject) => {
    options.signal.addEventListener('abort', () => {
      reject(new DOMException('The operation was aborted.', 'AbortError'))
    })
  })
}

describe('tus.FetchHttpStack', () => {
  it('should report its name', () => {
    expect(new FetchHttpStack().getName()).toBe('FetchHttpStack')
  })

  it('should expose the method and URL it was created with', () => {
    const req = new FetchHttpStack().createRequest('PATCH', 'http://tus.io/uploads/foo')

    expect(req.getMethod()).toBe('PATCH')
    expect(req.getURL()).toBe('http://tus.io/uploads/foo')
  })

  it('should store and return headers', () => {
    const req = new FetchHttpStack().createRequest('POST', 'http://tus.io/uploads')

    req.setHeader('Tus-Resumable', '1.0.0')

    expect(req.getHeader('Tus-Resumable')).toBe('1.0.0')
    expect(req.getHeader('Upload-Offset')).toBe(undefined)
  })

  it('should send the method, URL, headers and body to fetch', async () => {
    spyOn(window, 'fetch').and.resolveTo(new Response(null, { status: 204 }))

    const req = new FetchHttpStack().createRequest('PATCH', 'http://tus.io/uploads/foo')
    req.setHeader('Upload-Offset', '0')
    const body = new Blob(['hello world'])
    await req.send(body)

    expect(window.fetch).toHaveBeenCalledTimes(1)
    const [url, options] = window.fetch.calls.mostRecent().args
    expect(url).toBe('http://tus.io/uploads/foo')
    expect(options.method).toBe('PATCH')
    expect(options.headers).toEqual({ 'Upload-Offset': '0' })
    expect(options.body).toBe(body)
  })

  it('should resolve a response exposing status, headers and body', async () => {
    const response = new Response('hello world', {
      status: 200,
      headers: { 'Upload-Offset': '11' },
    })
    spyOn(window, 'fetch').and.resolveTo(response)

    const res = await new FetchHttpStack().createRequest('GET', 'http://tus.io/uploads/foo').send()

    expect(res.getStatus()).toBe(200)
    expect(res.getHeader('Upload-Offset')).toBe('11')
    expect(res.getBody()).toBe('hello world')
    expect(res.getUnderlyingObject()).toBe(response)
  })

  it('should return undefined for a missing response header', async () => {
    spyOn(window, 'fetch').and.resolveTo(new Response(null, { status: 204 }))

    const res = await new FetchHttpStack().createRequest('HEAD', 'http://tus.io/uploads/foo').send()

    expect(res.getHeader('Upload-Offset')).toBe(undefined)
  })

  it('should have no underlying request object', () => {
    const req = new FetchHttpStack().createRequest('POST', 'http://tus.io/uploads')

    expect(req.getUnderlyingObject()).toBe(undefined)
  })

  it('should accept a progress handler without reporting progress', async () => {
    spyOn(window, 'fetch').and.resolveTo(new Response(null, { status: 204 }))
    const onProgress = jasmine.createSpy('onProgress')

    const req = new FetchHttpStack().createRequest('PATCH', 'http://tus.io/uploads/foo')
    req.setProgressHandler(onProgress)
    await req.send(new Blob(['hello world']))

    // The Fetch API exposes no upload progress, so the handler is never invoked.
    expect(onProgress).not.toHaveBeenCalled()
  })

  it('should reject with an AbortError when aborted', async () => {
    spyOn(window, 'fetch').and.callFake(hangingFetch)

    const req = new FetchHttpStack().createRequest('PATCH', 'http://tus.io/uploads/foo')
    const sending = req.send(new Blob(['hello world']))
    await req.abort()

    await expectAsync(sending).toBeRejectedWithError(DOMException, /aborted/)
  })
})
