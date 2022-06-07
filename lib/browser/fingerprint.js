import isReactNative from './isReactNative'

// TODO: Differenciate between input types

/**
 * Generate a fingerprint for a file which will be used the store the endpoint
 *
 * @param {File} file
 * @param {Object} options
 * @param {Function} callback
 */
export default function fingerprint (file, options) {
  if (isReactNative()) {
    return Promise.resolve(reactNativeFingerprint(file, options))
  }

  return Promise.resolve([
    'tus-br',
    file.name,
    file.type,
    file.size,
    file.lastModified,
    options.endpoint,
  ].join('-'))
}

function reactNativeFingerprint (file, options) {
  const exifHash = file.exif ? hashCode(JSON.stringify(file.exif)) : 'noexif'
  return [
    'tus-rn',
    file.name || 'noname',
    file.size || 'nosize',
    exifHash,
    options.endpoint,
  ].join('/')
}

function hashCode (str) {
  /* eslint-disable no-bitwise */
  // from https://stackoverflow.com/a/8831937/151666
  let hash = 0
  if (str.length === 0) {
    return hash
  }
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash &= hash // Convert to 32bit integer
  }
  return hash
}
