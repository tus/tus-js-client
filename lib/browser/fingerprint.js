/**
 * Generate a fingerprint for a file which will be used the store the endpoint
 *
 * @param {File} file
 * @return {String}
 */
export default function fingerprint(file) {
  return [
		"tus",
		file.name,
		file.type,
		file.size,
		file.lastModified
  ].join("-");
}
