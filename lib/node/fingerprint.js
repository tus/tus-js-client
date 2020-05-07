import * as fs from "fs";
import * as path from "path";
import {createHash} from "crypto";

/**
 * Generate a fingerprint for a file which will be used the store the endpoint
 *
 * @param {File} file
 * @param {Object} options
 */
export default function fingerprint(file, options) {
  if (Buffer.isBuffer(file)) {
    // create MD5 hash for buffer type
    const blockSize = 64 * 1024;  // 64kb
    const content = file.slice(0, Math.min(blockSize, file.length));
    const hash = createHash("md5").update(content).digest("hex");
    const fingerprint = ["node-buffer", hash, file.length, options.endpoint].join("-");
    return Promise.resolve(fingerprint);
  }

  if (file instanceof fs.ReadStream && file.path != null) {
    return new Promise((resolve, reject) => {
      const name = path.resolve(file.path);
      fs.stat(file.path, (err, info) => {
        if (err) {
          return reject(err);
        }

        const fingerprint = [
          "node-file",
          name,
          info.size,
          info.mtime.getTime(),
          options.endpoint
        ].join("-");

        resolve(fingerprint);
      });
    });
  }

  // fingerprint cannot be computed for file input type
  return Promise.resolve(null);
}
