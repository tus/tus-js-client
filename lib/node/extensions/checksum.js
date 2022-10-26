import crypto from 'crypto'

class Checksum {
  static supportedAlgorithms = ['sha1', 'sha256', 'sha384', 'sha512', 'md5'];

  constructor (algo = 'sha256') {
    this.algo = this.resolveAlgo(algo)
  }

  /**
   * Resolves algorithm to one of the inbuilt types
   * @param {String} algo contains user provided checksumAlgo option
   */
  resolveAlgo = (algo) => {
    const resolvedAlgo = Checksum.supportedAlgorithms.find(supportedAlgo => supportedAlgo === algo.toLowerCase())
    if (!resolvedAlgo) throw new Error(`Checksum: unsupported checksumAlgo provided. Supported values are ${Checksum.supportedAlgorithms.join(',')}`)
    return resolvedAlgo
  }

  /**
   * Gets Hexadecimal digest using the algorithm set in this.algo
   * @param {ArrayBuffer} data contains the chunk of data to be hashed
   */
  getHexDigest = async (data) => {
    try {
      const hashHex = await crypto
        .createHash(this.algo)
        .update(data)
        .digest('hex')

      return hashHex
    } catch (err) {
      throw new Error('tus: could not compute checksum for integrity check')
    }
  };
}

export default Checksum
