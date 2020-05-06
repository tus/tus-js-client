/* eslint no-console: 0 */

var fs = require("fs");
var tus = require("../../");

var path = __dirname + "/../../README.md";
var file = fs.createReadStream(path);
var size = fs.statSync(path).size;

var options = {
  endpoint: "https://master.tus.io/files/",
  metadata: {
    filename: "README.md",
    filetype: "text/plain"
  },
  uploadSize: size,
  onError: function (error) {
    throw error;
  },
  onProgress: function (bytesUploaded, bytesTotal) {
    var percentage = (bytesUploaded / bytesTotal * 100).toFixed(2);
    console.log(bytesUploaded, bytesTotal, percentage + "%");
  },
  onSuccess: function () {
    console.log("Upload finished:", upload.url);
  }
};

var upload = new tus.Upload(file, options);
upload.start();
