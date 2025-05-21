/**
 * readAsByteArray converts a File/Blob object to a Uint8Array.
 * This function is only used on the Apache Cordova platform.
 * See https://cordova.apache.org/docs/en/latest/reference/cordova-plugin-file/index.html#read-a-file
 */
// TODO: Reconsider whether this is a sensible approach or whether we cause
// high memory usage with `chunkSize` is unset.
export function readAsByteArray(chunk: Blob): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (!(reader.result instanceof ArrayBuffer)) {
        reject(new Error(`invalid result types for readAsArrayBuffer: ${typeof reader.result}`))
        return
      }
      const value = new Uint8Array(reader.result)
      resolve(value)
    }
    reader.onerror = (err) => {
      reject(err)
    }
    reader.readAsArrayBuffer(chunk)
  })
}
