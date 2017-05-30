import bufferFrom from "buffer-from";

export function encode(data) {
  return bufferFrom(String(data)).toString("base64");
}

export const isSupported = true;
