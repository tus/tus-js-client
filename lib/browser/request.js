/* global window */
import resolve from "resolve-url";

export function newRequest() {
  return new window.XMLHttpRequest();
}

export function resolveUrl(origin, link) {
  return resolve(origin, link);
}
