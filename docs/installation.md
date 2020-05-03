# Installation

There are two ways to install tus-js-client:

## Install from NPM (recommended)

Install the package using a package manager, such as `npm` or `yarn`:

```
$ npm install --save tus-js-client
```

After that, you can load the package:

```js
var tus = require("tus-js-client");
```

## Embed using a script tag

If you are not using a web bundler, you can directly embed the prebuilt script directly:

```html
<script src="dist/tus.js"></script>
<script>
  var upload = new tus.Upload(...);
</script>
```

# Runtime requirements

tus-js-client has some requirements in which environments it can properly function.

## Browser support

<a href="https://browserstack.com">
  <img alt="BrowserStack logo" src="/docs/browserstack.png" align="right" />
</a>

tus-js-client is tested and known to support following browsers:

* Internet Explorer 10+
* Microsoft Edge 12+
* Mozilla Firefox 14+
* Google Chrome 20+
* Safari 6+
* Opera 12.1+
* iOS 6.0+
* Android 5.0+

Support in other browsers is *very likely* but has not been confirimed yet.
Since we only use Web Storage, XMLHttpRequest2, the File API and Blob API,
more than 95% of today's users should be able to use tus-js-client.

Compatability between browsers is continuously ensured by automated tests
in the corresponding browsers on [BrowserStack](https://browserstack.com),
who provide their great service glady for Open Source project for free.

## Node.js support

tus-js-client is tested and known to work in Node.js v8 or newer.

Since Node's environment is quite different than a browser's runtime and
provides other capabilities but also restrictions, tus-js-client will have a
slightly changed behavior when used in the context of a Node.js application:

* As the Web Storage API is only available in browser environments,
tus-js-client will not be able store the URLs of created uploads allowing
automatic resuming. Please consult the documentation for the `tus.canStoreURLs`
for more information on this specific topic.

* The `tus.Upload` constructor will only accept instances of `buffer.Buffer`
and `stream.Readable` as file inputs. If you are passing a readable stream as
this argument, you must set the `chunkSize` option to a finite integer value
because the chunk, which is currently being uploaded, will be held in memory
allowing automatic retries, e.g. after connection interruptions. Therefore
additional care should be taken when choosing the appropriate value for your
specific application to control memory consumption.

* If you call the `tus.Upload` constructor with an instance of the
`fs.ReadStream`, the above point does not apply, meaning *no* chunk will be held
in memory. Instead, tus-js-client will create it's own stream starting at the
needed position using `fs.createReadStream`. If you want to disable this
functionality, you may want to wrap the `fs.ReadStream` into a
`stream.PassThrough`.

Finally, you may be interested in the `demos/nodejs/index.js` example which demonstrates
a simple example on how to easily use tus-js-client using Node.js.

## React Native support

tus-js-client can be used in React Native applications with nearly all of its functionality.
Since there is no browser-like File object types in React Native, files are represented
by objects with an `uri` property (i.e. `{ uri: 'file:///...', ... }`).
tus-js-client accepts these objects and automatically resolves the file URI and
uploads the fetched file.
This allows you to directly pass the results from a file/image picker to
tus-js-client. A full example of this can be found in our
[React Native demo](/demos/reactnative/App.js).

The only unavailable feature is upload URL storage (for resuming them in later
sessions) because React Native does not implement the Web Storage API. You can
test this programmatically using the `tus.canStoreURLs` property which will
always be set to `false` in React Native environments. In the end, this means
that the `fingerprint`, `resume` and `removeFingerprintOnSuccess` options
to not have any influence on the behavior because their values are ignored
when using React Native.
