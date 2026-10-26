import { getTusEndpoint } from './helpers/tusEndpoint.js'

describe('tus endpoint', () => {
  const env = globalThis.process.env
  const originalEndpoint = env.TUS_ENDPOINT
  const originalCi = env.CI
  const originalLocation = globalThis.location
  const originalKarma = globalThis.__karma__

  function restoreEnv(name, value) {
    if (value === undefined) delete env[name]
    else env[name] = value
  }

  afterEach(() => {
    restoreEnv('TUS_ENDPOINT', originalEndpoint)
    restoreEnv('CI', originalCi)
    if (originalLocation === undefined) delete globalThis.location
    else globalThis.location = originalLocation
    if (originalKarma === undefined) delete globalThis.__karma__
    else globalThis.__karma__ = originalKarma
  })

  it('falls back to the public demo', () => {
    delete env.TUS_ENDPOINT
    delete env.CI
    expect(getTusEndpoint()).toBe('https://tusd.tusdemo.net/files/')
  })

  it('uses TUS_ENDPOINT and adds a trailing slash', () => {
    delete env.CI
    env.TUS_ENDPOINT = 'http://127.0.0.1:8080/files'
    expect(getTusEndpoint()).toBe('http://127.0.0.1:8080/files/')
  })

  it('keeps an existing trailing slash', () => {
    delete env.CI
    env.TUS_ENDPOINT = ' http://127.0.0.1:8080/files/ '
    expect(getTusEndpoint()).toBe('http://127.0.0.1:8080/files/')
  })

  it('prefers TUS_ENDPOINT over the Karma config and the page query', () => {
    delete env.CI
    env.TUS_ENDPOINT = 'http://127.0.0.1:8080/files/'
    globalThis.__karma__ = { config: { tusEndpoint: 'http://karma.example/files/' } }
    globalThis.location = { search: '?endpoint=http://query.example/files/' }
    expect(getTusEndpoint()).toBe('http://127.0.0.1:8080/files/')
  })

  it('reads the endpoint Karma forwarded from the environment', () => {
    delete env.TUS_ENDPOINT
    delete env.CI
    globalThis.__karma__ = { config: { tusEndpoint: 'http://127.0.0.1:9090/files' } }
    expect(getTusEndpoint()).toBe('http://127.0.0.1:9090/files/')
  })

  it('reads ?endpoint= from the page URL', () => {
    delete env.TUS_ENDPOINT
    delete env.CI
    globalThis.location = { search: '?endpoint=http://127.0.0.1:1080/files' }
    expect(getTusEndpoint()).toBe('http://127.0.0.1:1080/files/')
  })

  it('requires TUS_ENDPOINT when CI is set', () => {
    delete env.TUS_ENDPOINT
    env.CI = 'true'
    expect(getTusEndpoint).toThrowError('TUS_ENDPOINT is required when CI is set')
  })

  it('requires the endpoint when Karma was started with CI set', () => {
    delete env.TUS_ENDPOINT
    delete env.CI
    globalThis.__karma__ = { config: { tusEndpoint: '  ', requireTusEndpoint: true } }
    expect(getTusEndpoint).toThrowError('TUS_ENDPOINT is required when CI is set')
  })
})
