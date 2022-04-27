import crypto from "crypto";

class Checksum {
  constructor(algo = "sha256") {
    this.algo = algo;
  }
  /**
   *
   * @param {ArrayBuffer} data contains the chunk of data to be hashed
   */
  getHexDigest = async (data) => {
    try {
      const hashHex = await crypto
        .createHash(this.algo)
        .update(data)
        .digest("hex");

      return hashHex;
    } catch (err) {
      throw new Error("tus: could not compute checksum for integrity check");
    }
  };
}

export default Checksum;
