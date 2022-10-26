class Checksum {
  static supportedAlogrithms = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];

  constructor (algo = 'SHA-256') {
    this.algo = this._resolveAlgo(algo)
  }

  /**
   * Resolves algorithm to one of the inbuilt types
   * @param {String} algo contains user provided checksumAlgo option
   */
  _resolveAlgo = (algo) => {
    const resolvedAlgo = Checksum.supportedAlgorithms.find(supportedAlgo => supportedAlgo === algo.toUpperCase())
    if (!resolvedAlgo) {
      throw new Error(
        `tus: unsupported checksumAlgo provided. Supported values are : ${Checksum.supportedAlgorithms.join(',')}`,
      )
    }
    return resolvedAlgo
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
      throw new Error('tus: could not compute checksum for integrity check')
    }
  };
}
export default Checksum
