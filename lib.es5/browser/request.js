"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.newRequest = newRequest;
/* global window */

function newRequest() {
  return new window.XMLHttpRequest();
};