/* global: window */

const {btoa} = window;

export function encode(data) {
  return btoa(unescape(encodeURIComponent(data)));
}

export const isSupported = "btoa" in window;
