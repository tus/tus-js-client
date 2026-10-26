// `lib/browser/urlStorage.ts` runs its feature detection at module scope, so a throw
// there takes down the browser entry point on import, and with it any hope of using
// tus-js-client in a Service Worker. This proves the module survives the absence of
// `window`, which is the condition that used to throw.
//
// Node and Deno both lack `window`, and they disagree about `localStorage` -- Deno
// implements Web Storage, while Node defines the global but leaves it unusable
// without `--localstorage-file`. So what is asserted is that the module LOADS and
// reports the runtime it actually found, rather than a fixed answer that would only
// hold on one of them.
describe('browser urlStorage without DOM globals', () => {
  it('should load where window does not exist', async () => {
    expect(typeof window).toBe('undefined')

    const { canStoreURLs } = await import('../../lib.esm/browser/urlStorage.js')

    expect(canStoreURLs).toBe(
      typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function',
    )
  })
})
