/**
 * readAsByteArray converts a File object to a Uint8Array.
 * This function is only used on the Apache Cordova platform.
 * See https://cordova.apache.org/docs/en/latest/reference/cordova-plugin-file/index.html#read-a-file
 */
function readAsByteArray(chunk, callback) {
  let reader = new FileReader();
  reader.onload = () => {
    callback(null, new Uint8Array(reader.result));
  };
  reader.onerror = (err) => {
    callback(err);
  };
  reader.readAsArrayBuffer(chunk);
}

export default readAsByteArray;
