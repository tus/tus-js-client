/**
 * Generate a fingerprint for a file which will be used the store the endpoint
 *
 * @param {File} file
 * @return {String}
 */
export default function fingerprint(file, options) {
  return [
    "tus",
    file.name,
    file.type,
    file.size,
    file.lastModified,
    options.endpoint
  ].join("-");
}
