let Upload = require("./upload")

const support = "XMLHttpRequest" in window &&
                "localStorage" in window &&
                "Blob" in window &&
                typeof Blob.prototype.slice === "function"

exports.isSupported = support
exports.Upload = Upload
exports.defaultOptions = Upload.defaultOptions
