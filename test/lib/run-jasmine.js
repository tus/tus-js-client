// This script was taken from https://gist.github.com/sheelc/8378550

var system = require("system"),
    fs = require("fs"),
    page = require("webpage").create(),
    showColor = true,
    url = system.args[1];

if (system.args[1] == "--no-color" || system.args[2] == "--no-color") {
  showColor = false;
  if (system.args[1] == "--no-color") {
    url = system.args[2];
  }
}

page.onConsoleMessage = function(msg) {
  fs.write("/dev/stdout", msg, "w");
};

page.onError = function() {
  console.log.apply(console, arguments);
};

page.onAlert = function() {
  console.log.apply(console, arguments);
};

if (!url) {
  console.log("argument is required: location of jasmine tests");
  phantom.exit(1);
}

var dateStarted = Date.now();
page.onCallback = function(message) {
  if (message === "parse time") {
    page.evaluate(function(showColor) {
      jasmineRequire.console(jasmineRequire, jasmine);
      var consoleReporter = jasmine.ConsoleReporter({
        print: function() { console.log.apply(console, arguments); },
        showColors: showColor,
        timer: new jasmine.Timer()
      });
      jasmine.getEnv().addReporter(consoleReporter);
      jasmine.getEnv().addReporter({
        jasmineDone: function() { window.callPhantom('jasmine done'); },
        specDone: function(result) { window.specsFailed = window.specsFailed || (result.status === "failed") }
      });
    }, showColor);
  } else if (message === "jasmine done") {
    var timeElapsed = Date.now() - dateStarted,
        minimumExecutionTime = 1500;

    var exitCode = page.evaluate(function() {
      return window.specsFailed ? 1 : 0;
    });

    var exitFn = function() { phantom.exit(exitCode); };

    if (timeElapsed < minimumExecutionTime) {
      setTimeout(exitFn, minimumExecutionTime - timeElapsed);
    } else {
      exitFn();
    }
  }
};

page.open(url, function(status) {
  if (status !== "success") {
    console.log("could not successfully open up page at: " + url);
    phantom.exit(1);
  }
});
