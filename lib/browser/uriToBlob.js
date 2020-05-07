/**
 * uriToBlob resolves a URI to a Blob object. This is used for
 * React Native to retrieve a file (identified by a file://
 * URI) as a blob.
 */
export default function uriToBlob(uri) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.responseType = "blob";
    xhr.onload = () => {
      const blob = xhr.response;
      resolve(blob);
    };
    xhr.onerror = (err) => {
      reject(err);
    };
    xhr.open("GET", uri);
    xhr.send();
  });
}
