const isCordova = () =>
  typeof window !== 'undefined' &&
  ('PhoneGap' in window || 'Cordova' in window || 'cordova' in window)

export { isCordova }
