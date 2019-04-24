import isReactNative from "./node/isReactNative";

/**
 * Generate a fingerprint for a file which will be used the store the endpoint
 *
 * @param {File} file
 * @return {String}
 */
export default function fingerprint(file, options) {
  if (isReactNative) {
    return reactNativeFingerprint(file, options);
  }

  return [
    "tus",
    file.name,
    file.type,
    file.size,
    file.lastModified,
    options.endpoint
  ].join("-");
}

function reactNativeFingerprint(file, options) {
  let exifHash = file.exif ? hashCode(JSON.stringify(file.exif)) : "noexif";
  return [
    "tus",
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
