"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setItem = setItem;
exports.getItem = getItem;
exports.removeItem = removeItem;
/* global window */

var _window = window;
var localStorage = _window.localStorage;
function setItem(key, value) {
  return localStorage.setItem(key, value);
}

function getItem(key) {
  return localStorage.getItem(key);
}

function removeItem(key) {
  return localStorage.removeItem(key);
}