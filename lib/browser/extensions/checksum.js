class Checksum {
  constructor(algo = "SHA-256") {
    this.algo = algo;
  }
  /**
   *
   * @param {ArrayBuffer} data contains the chunk of data to be hashed
   */
  getHexDigest = async (data) => {
    try {
      const hashBuffer = await crypto.subtle.digest(this.algo, data);
      const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
      const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(""); // convert bytes to hex string
      return hashHex;
    } catch (err) {
      throw new Error("tus: could not compute checksum for integrity check");
    }
  };
}
export default Checksum;
