## Building

```bash
# Install dependencies
npm install

# Build bundle and test scripts
npm run build

# Watch source and rebuild
npm run watch
```

## Testing

Tests are implemented using Jasmine and can be found in the `test/` directory.
In order to run the tests, open `test/SpecRunner.html` in a browser and you
should see a visual representation of the test results. No web server is
required, you can open `SpecRunner.html` using the `file:///` protocol.

Tests can also be run on SauceLabs' cloud infrastructure using `npm test`.
Before using this command, you have to set up your SauceLabs account by filling
the `SAUCE_USERNAME` and `SAUCE_ACCESS_KEY` variables else the command will fail.
