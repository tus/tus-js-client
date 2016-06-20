/* eslint no-console: 0 */

var fs = require("fs");
var tus = require("../");

var path = "./dist/tus.js";
var file = fs.createReadStream("./dist/tus.js");
var size = fs.statSync(path).size;

var options = {
  endpoint: "http://master.tus.io/files/",
  resume: true,
  metadata: {
      filename: "tus.js"
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
