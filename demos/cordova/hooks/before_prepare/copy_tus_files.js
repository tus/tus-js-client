#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..", "..");
const tusJsPath = path.join(rootDir, "..", "..", "dist", "tus.js");
const assetsDir = path.join(rootDir, "www", "js", "tus.js");

fs.copyFile(tusJsPath, assetsDir, function (err) {
  if (err) throw err;
});
