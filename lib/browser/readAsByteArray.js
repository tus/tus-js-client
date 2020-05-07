/**
 * readAsByteArray converts a File object to a Uint8Array.
 * This function is only used on the Apache Cordova platform.
 * See https://cordova.apache.org/docs/en/latest/reference/cordova-plugin-file/index.html#read-a-file
 */
export default function readAsByteArray(chunk) {
  return new Promise((resolve, reject) => {
    let reader = new FileReader();
    reader.onload = () => {
      const value = new Uint8Array(reader.result);
      resolve({ value });
    };
    reader.onerror = (err) => {
      reject(err);
    };
    reader.readAsArrayBuffer(chunk);
  });

}
