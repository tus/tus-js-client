/**
 * uriToBlob resolves a URI to a Blob object. This is used for
 * React Native to retrieve a file (identified by a file://
 * URI) as a blob.
 */
function uriToBlob(uri, done) {
  const xhr = new XMLHttpRequest();
  xhr.responseType = "blob";
  xhr.onload = () => {
    const blob = xhr.response;
    done(null, blob);
  };
  xhr.onerror = (err) => {
    done(err);
  };
  xhr.open("GET", uri);
  xhr.send();
}

export default uriToBlob;
