import crypto from 'crypto'

class Checksum {
  static supportedAlgorithms = ['sha1', 'sha256', 'sha384', 'sha512', 'md5'];

  constructor (algo = 'sha256') {
    if (!Checksum.supportedAlgorithms.includes(algo)) {
      throw new Error(
        `Checksum: unsupported checksumAlgo provided. Supported values are ${Checksum.supportedAlgorithms.join(
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
