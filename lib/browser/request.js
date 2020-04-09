/* global window */
import URL from "url-parse";

export default class BrowserHttpStack {
  createRequest() {
    return new window.XMLHttpRequest();
  }
  resolveUrl(origin, link) {
    return new URL(link, origin).toString();
  }

  getName() {
    return "BrowserHttpStack";
  }
}
