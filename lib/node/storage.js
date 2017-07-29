/* eslint no-unused-vars: 0 */
/* eslint no-console: 0 */
const fs = require("fs");
export const canStoreURLs = true;
function store(key) {
  return `${__dirname}/${key}.tus-key`;
}
export function setItem(key, value) {
  console.log("setItem", key, value);
  try {
    fs.writeFileSync(store(key), value, "utf-8");
  } catch (e) {
    console.log("error saving", e);
  }
}

export function getItem(key) {
  console.log("getItem", key);
  try {
    const res = fs.readFileSync(store(key));
    return res.toString();
  } catch (e) {
    console.log("error getting item", e);
    return null;
  }
}

export function removeItem(key) {
  try {
    fs.unlinkSync(store(key));
  } catch (e) {
    console.log("error removing item",e);
  }
}
