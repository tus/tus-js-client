function noop() {}

var localStorage = {};
localStorage.setItem = noop;
localStorage.getItem = noop;
localStorage.clear = noop;
localStorage.removeItem = noop;

// Expose localStorage as a global object
global.localStorage = localStorage;
