class Checksum {
  static supportedAlgorithms = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];

  constructor (algo = 'SHA-256') {
    // Checking support for crypto on the browser
    if (!crypto) {
      throw new Error(`tus: this browser does not support checksum`)
    } else if (!Checksum.supportedAlgorithms.includes(algo)) {
      throw new Error(
        `tus: unsupported checksumAlgo provided. Supported values are : ${Checksum.supportedAlgorithms.join(
          ',',
        )}`,
      )
    } else {
      this.algo = algo
    }
  }

  /**
   * Gets Hexadecimal digest using the algorithm set in this.algo
   * @param {ArrayBuffer} data contains the chunk of data to be hashed
   */

  getHexDigest = async (data) => {
    try {
      const hashBuffer = await crypto.subtle.digest(this.algo, data)
      const hashArray = Array.from(new Uint8Array(hashBuffer)) // convert buffer to byte array
      const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('') // convert bytes to hex string
      return hashHex
    } catch (err) {
      throw new Error('tus: could not compute checksum for integrity check', err)
    }
  };
}
export default Checksum
