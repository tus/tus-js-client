# Contributing

If you are interested in contributing to tus-js-client or just want to work on the library itself, this guide will provide you with instructions on how to setup the development environment. You must have **Git** and **Node.js** installed to follow along.

## Getting the code

```bash
# Clone the git repository
git clone git@github.com:tus/tus-js-client.git
cd tus-js-client

# Install dependencies
npm install
```

## Developing

```bash
# Build the library bundle and all test scripts
npm run build

# Watch source files and rebuild when files get changes
npm run watch
```

## Testing

Tests are implemented using Jasmine and can be found in the `test/` directory. These tests can be run in different environments:
* To run the tests inside **Node.js** use the command `npm run test-node`.
* To run the tests inside **Puppeteer** (an automated browser) use the command `npm run test-puppeteer`.
* To run the tests in your browser open `test/SpecRunner.html` in a browser and you should see a visual representation of the test results. No web server is required, you can open `SpecRunner.html` using the `file:///` protocol.
* To run the tests on BrowserStack's cloud testing infrastructure use `npm run test-browserstack`.  Before using this command, you have to set up your BrowserStack account by filling the `BROWSERSTACK_USERNAME` and `BROWSERSTACK_KEY` variables or else the command will fail.

Also note that you have to rebuild the library before you run the tests. So either you automatically let `npm run watch` listen for file changes and automatically rebuild the needed artifacts, or you run `npm run build` on your own before you execute the tests.
