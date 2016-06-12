// FakeBlob is a subclass of Buffer as it is one of the few types which can be
// used as a body for HTTP requests.
var FakeBlob = Buffer;

// Emulate the File#size property which is presented in browsers as tests rely
// on this (but not the module itself)
Object.defineProperty(FakeBlob.prototype, "size", {
  get: function () {
    return this.length;
  }
});

// Expose FakeBlob as a global class
global.FakeBlob = FakeBlob;
