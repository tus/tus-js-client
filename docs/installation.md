# Installation

There are two ways to install tus-js-client:

## Install from NPM (recommended)

Install the package using a package manager, such as `npm` or `yarn`:

```
$ npm install --save tus-js-client
```

After that, you can load the package:

```js
var tus = require('tus-js-client')
```

If your bundler supports ES Modules, you can use:

```js
import * as tus from 'tus-js-client'
```

## Embed using a script tag

If you are not using a web bundler, you can download the latest prebuilt script and embed it directly:

- Unminified version: [tus.js](https://cdn.jsdelivr.net/npm/tus-js-client@latest/dist/tus.js)
- Minified version: [tus.min.js](https://cdn.jsdelivr.net/npm/tus-js-client@latest/dist/tus.min.js) (recommended)

```html
<script src="./tus.min.js"></script>
<script>
  var upload = new tus.Upload(...);
</script>
```

# Runtime requirements & limitations

tus-js-client can be used in following environments:

- Browsers
- Node.js
- React Native applications
- Apache Cordova applications

Please see the following sections for more details on environment-specific requirements and possible limitations.

One general requirement is that the JavaScript environment must support [Promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises), which is the case for modern browsers and Node.js. However, if your application runs in older browsers or other environments without support for Promises, you can use a Promise polyfill to fill this gap. Have a look at [caniuse.com](https://caniuse.com/#feat=promises) for a list of those browsers and [core-js](https://github.com/zloirock/core-js#ecmascript-promise) for polyfilling.

When polyfilling, load the polyfill _before_ loading tus-js-client:

```js
require('core-js/features/promise')
var tus = require('tus-js-client')
```

## Browser support

<a href="https://browserstack.com">
  <img alt="BrowserStack logo" src="/docs/browserstack.png" align="right" />
</a>

tus-js-client is tested and known to support following browsers:

- Microsoft Edge 12+
- Mozilla Firefox 14+
- Google Chrome 20+
- Safari 6+
- Opera 12.1+
- iOS 6.0+
- Android 5.0+

Support in other browsers is _very likely_ but has not been confirmed yet.
Since we only use Web Storage, XMLHttpRequest2, the File API and Blob API,
more than 95% of today's users should be able to use tus-js-client.

Compatibility between browsers is continuously ensured by automated tests
in the corresponding browsers on [BrowserStack](https://browserstack.com),
who provide their great service glady for Open Source project for free.

## Node.js support

tus-js-client is tested and known to work in Node.js v18 or newer.

Since Node's environment is quite different than a browser's runtime and
provides other capabilities but also restrictions, tus-js-client will have a
slightly changed behavior when used in the context of a Node.js application:

- As the Web Storage API is only available in browser environments,
  tus-js-client will by default not store the URLs of created uploads. To manually
  enable this feature, please consult the `urlStorage` option for the `tus.Upload`
  constructor.

- The `tus.Upload` constructor will only accept instances of `buffer.Buffer`
  and `stream.Readable` as file inputs. If you are passing a readable stream as
  this argument, you must set the `chunkSize` option to a finite integer value
  because the chunk, which is currently being uploaded, will be held in memory
  allowing automatic retries, e.g. after connection interruptions. Therefore
  additional care should be taken when choosing the appropriate value for your
  specific application to control memory consumption.

- If you call the `tus.Upload` constructor with an instance of the
  `fs.ReadStream`, the above point does not apply, meaning _no_ chunk will be held
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
that the `fingerprint`, `storeFingerprintForResuming` and `removeFingerprintOnSuccess` options
to not have any influence on the behavior because their values are ignored
when using React Native.

## Bundle sizes

tus-js-client is a small library and its bundle for the browser has roughly following sizes:

- Non-minified (tus.js): ~160 KiB
- Minified (tus.min.js): ~65 KiB
- Minified and gzipped: ~18 KiB
