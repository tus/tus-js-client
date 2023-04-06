/**
 * uriToBlob resolves a URI to a Blob object. This is used for
 * React Native to retrieve a file (identified by a file://
 * URI) as a blob.
 */

export default async function uriToBlob(uri) {
  const res = await fetch(uri)
  return res.blob()
}
