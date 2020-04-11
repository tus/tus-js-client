/* global window */

export default class BrowserHttpStack {
  createRequest() {
    return new window.XMLHttpRequest();
  }

  getName() {
    return "BrowserHttpStack";
  }
}
