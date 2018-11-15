function uriToBlob (uri) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.responseType = "blob";
    xhr.onload = () => {
      const blob = xhr.response;
      resolve(blob);
    }
    xhr.onerror = (err) => {
      reject(err);
    }
    xhr.open("GET", uri);
    xhr.send();
  })
}

export default uriToBlob;
