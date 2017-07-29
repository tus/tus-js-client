// Generated by Babel
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setItem = setItem;
exports.getItem = getItem;
exports.removeItem = removeItem;
/* eslint no-unused-vars: 0 */
/* eslint no-console: 0 */
var fs = require("fs");
var canStoreURLs = exports.canStoreURLs = true;
function store(key) {
  return __dirname + "/" + key + ".tus-key";
}
function setItem(key, value) {
  console.log("setItem", key, value);
  try {
    fs.writeFileSync(store(key), value, "utf-8");
  } catch (e) {
    console.log("error saving", e);
  }
}

function getItem(key) {
  console.log("getItem", key);
  try {
    var res = fs.readFileSync(store(key));
    return res.toString();
  } catch (e) {
    console.log("error getting item", e);
    return null;
  }
}

function removeItem(key) {
  try {
    fs.unlinkSync(store(key));
  } catch (e) {
    console.log("error removing item", e);
  }
}