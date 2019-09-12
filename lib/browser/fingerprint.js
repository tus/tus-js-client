import isReactNative from "./isReactNative";

/**
 * Generate a fingerprint for a file which will be used the store the endpoint
 *
 * @param {File} file
 * @param {Object} options
 * @param {Function} callback
 */
export default function fingerprint(file, options, callback) {
  if (isReactNative()) {
    return callback(null, reactNativeFingerprint(file, options));
  }

  return callback(null, [
    "tus-br",
    file.name,
    file.type,
    file.size,
    file.lastModified,
    options.endpoint
  ].join("-"));
}

function reactNativeFingerprint(file, options) {
  let exifHash = file.exif ? hashCode(JSON.stringify(file.exif)) : "noexif";
  return [
    "tus-rn",
    file.name || "noname",
    file.size || "nosize",
    exifHash,
    options.endpoint
  ].join("/");
}

function hashCode(str) {
  // from https://stackoverflow.com/a/8831937/151666
  var hash = 0;
  if (str.length === 0) {
    return hash;
  }
  for (var i = 0; i < str.length; i++) {
    var char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}
