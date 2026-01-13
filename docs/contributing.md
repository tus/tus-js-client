# Contributing

If you are interested in contributing to tus-js-client or just want to work on the library itself, this guide will provide you with instructions on how to setup the development environment. You must have **Git**, **Node.js** and **Yarn** installed to follow along.

## Getting the code

```bash
# Clone the git repository
git clone git@github.com:tus/tus-js-client.git
cd tus-js-client

# Install dependencies
yarn install
```

## Developing

```bash
# Build the library bundle and all test scripts
yarn run build

# Watch source files and rebuild when files get changes
yarn run watch
```

## Testing

Tests are implemented using Jasmine and can be found in the `test/` directory. These tests can be run in different environments:

- To run the tests inside **Node.js** use the command `yarn run test-node`.
- To run the tests inside **Puppeteer** (an automated browser) use the command `yarn run test-puppeteer`.
- To run the tests in your browser open `test/SpecRunner.html` in a browser and you should see a visual representation of the test results. No web server is required, you can open `SpecRunner.html` using the `file:///` protocol.

Also note that you have to rebuild the library before you run the tests. So either you automatically let `yarn run watch` listen for file changes and automatically rebuild the needed artifacts, or you run `yarn run build` on your own before you execute the tests.

## Releasing

Releases are automatically handled via GitHub Actions. Whenever a commit is tagged, a new release will be published from that commit to NPM. The tag must match the `v*` pattern and has to include the same version as in `package.json`. There are two ways how this can easily be done:

- Run `npm version` locally and push the resulting commit and tag to GitHub.
- Edit `package.json` directly on GitHub (optionally in a pull request) and manually create a release, which in turn creates the tag.

It's also possible to create pre-releases from branches other than `main`. Simply include a suffix in the version in `package.json`, such as `5.0.0-pre1` and create a tag in the desired branch. This is handy for publishing pre-releases from pull requests.
