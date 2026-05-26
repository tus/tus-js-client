// This file is generated from Transloadit API2 TUS protocol contracts. If it looks wrong,
// please report the issue instead of editing this file by hand; the source fix
// belongs in the protocol contract generator so all TUS clients stay in sync.

const isCordova = () =>
  typeof window !== 'undefined' &&
  ('PhoneGap' in window || 'Cordova' in window || 'cordova' in window)

export { isCordova }
