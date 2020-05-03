## FAQ

### How can I access the upload's ID?

tus-js-client identifies and accesses uploads by their URL and *not* their ID.
Therefore, there is no direct functionality for getting the upload ID. However,
with most tus server you are able to extract the upload ID from the the upload
URL. The upload URL can be accessed using the
[`Upload#url` property](https://github.com/tus/tus-js-client#tusuploadurl) after
an upload has been started. For example, the [tusd](https://github.com/tus/tusd)
server and [tus-node-server](https://github.com/tus/tus-node-server) have URLs
such as https://master.tus.io/files/accbccf63e9afedef9fbc1e6082835dc where the
last segment is the upload URL.
