/**
 * Generate a fingerprint for a file which will be used the store the endpoint
 *
 * @param {File} file
 * @return {String}
 */
import md5File from "md5-file";

export default function fingerprint(file) {
  return [
		"tus",
		md5File.sync(file.path)
  ].join("-");
}
