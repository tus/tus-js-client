import * as fs from "fs";
import {resolve} from "path";
import {createHash} from "crypto";


/**
 * Generate a fingerprint for a file which will be used the store the endpoint
 *
 * @param {File} file
 * @param {Object} options
 * @param {Function} callback
 */
export default function fingerprint(file, options, callback) {
  const prefix = "tus-nd";
  if (file instanceof fs.ReadStream && file.path != null) {
    const name = resolve(file.path);
    fs.stat(file.path, (err, info) => {
      if (err) {
        return callback(err);
      }

      return callback(null, [
        prefix,
        name,
        info.size,
        info.mtime.getTime(),
        options.endpoint
      ].join("-"));
    });
  }

  if (Buffer.isBuffer(file)) {
    // create MD5 hash for buffer type
    const blockSize = 64 * 1024;  // 64kb
    const content = file.slice(0, Math.min(blockSize, file.length));
    const hash = createHash("md5").update(content).digest("hex");
    return callback(null, [prefix, hash, file.length, options.endpoint].join("-"));
  }

  return callback(new Error("Fingerprint cannot be computed for file input type"));
}
