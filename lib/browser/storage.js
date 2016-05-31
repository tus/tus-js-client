/* global window */

const {localStorage} = window;

export function setItem(key, value) {
  return localStorage.setItem(key, value);
}

export function getItem(key) {
  return localStorage.getItem(key);
}

export function removeItem(key) {
  return localStorage.removeItem(key);
}
