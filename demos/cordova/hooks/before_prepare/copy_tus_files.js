#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..", "..");
const tusJsPath = path.join(rootDir, "node_modules", "tus-js-client", "dist", "tus.js");
const assetsDir = path.join(rootDir, "www", "js", "tus.js");

fs.copyFile(tusJsPath, assetsDir, function (err) {
  if (err) throw err;
});
