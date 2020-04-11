/* eslint no-console: 0 */

var fs = require("fs");
var tus = require("../");

var durations = [];

function doUpload(cb) {
  var start = Date.now();
  var path = "/home/marius/Hello.docx";
  //var path = "/home/marius/Downloads/DSF3114.jpg";
  var file = fs.createReadStream(path);
  var size = fs.statSync(path).size;

  var options = {
    endpoint: process.argv[2] || "http://localhost:1080/files/",
    resume: true,
    metadata: {
      filename: "README.md",
      filetype: "text/plain"
    },
    headers: {
      "Host": "master.tus.io"
    },
    uploadSize: size,
    //uploadDataDuringCreation: true,
    onError: function (error) {
      throw error;
    },
    onProgress: function (bytesUploaded, bytesTotal) {
    },
    onSuccess: function () {
      console.log("Upload finished:", upload.url);
      var end = Date.now();
      durations.push(end - start);
      cb();
    }
  };

  var upload = new tus.Upload(file, options);
  upload.start();
}

function doUploads(count, cb) {
  if (count === 0) {
    return cb();
  }

  doUpload(() => {
    doUploads(count - 1, cb);
  });
}

doUploads(50, () => {
  console.log(durations);
  var sorted = durations.sort();
  var min = durations[0];
  var max = durations[durations.length - 1];
  var sum = durations.reduce((a, b) => a+b);
  var avg = sum / durations.length;

  console.log("Min", min);
  console.log("Max", max);
  console.log("Avg", avg);
});
