// FakeBlob is a subclass of Buffer as it is one of the few types which can be
// used as a body for HTTP requests.
var FakeBlob = Buffer;

// Expose FakeBlob as a global class
global.FakeBlob = FakeBlob;
