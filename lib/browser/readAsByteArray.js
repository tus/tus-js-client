/* In cordova FileReader is used to read a slice of the file */
function readAsByteArray(chunk, done) {
    let reader = new FileReader();
    reader.onload = () => {
      done(null, new Uint8Array(reader.result));
    };
    reader.onerror = (err) => {
      done(err);
    };
    reader.readAsArrayBuffer(chunk);
  }

  export default readAsByteArray;