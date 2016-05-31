/* global: Buffer */

export function encode(data) {
  return new Buffer(data).toString("base64");
}

export const isSupported = true;
