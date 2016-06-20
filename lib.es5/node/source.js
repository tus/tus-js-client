"use strict";

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getSource = getSource;

var _stream = require("stream");

var _fs = require("fs");

var _temp = require("temp");

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var BufferSource = function () {
  function BufferSource(buffer) {
    _classCallCheck(this, BufferSource);

    this._buffer = buffer;
    this.size = buffer.length;
  }

  _createClass(BufferSource, [{
    key: "slice",
    value: function slice(start, end) {
      var buf = this._buffer.slice(start, end);
      buf.size = buf.length;
      return buf;
    }
  }, {
    key: "close",
    value: function close() {}
  }]);

  return BufferSource;
}();

var FileSource = function () {
  function FileSource(stream) {
    _classCallCheck(this, FileSource);

    this._stream = stream;
    this._path = stream.path.toString();
  }

  _createClass(FileSource, [{
    key: "slice",
    value: function slice(start, end) {
      debugger;
      var stream = (0, _fs.createReadStream)(this._path, {
        start: start,
        end: end,
        autoClose: true
      });
      stream.size = end - start;
      return stream;
    }
  }, {
    key: "close",
    value: function close() {
      this._stream.destroy();
    }
  }]);

  return FileSource;
}();

var StreamSource = function (_FileSource) {
  _inherits(StreamSource, _FileSource);

  function StreamSource(stream) {
    _classCallCheck(this, StreamSource);

    var tempStream = (0, _temp.createWriteStream)();
    stream.pipe(tempStream);
    return _possibleConstructorReturn(this, Object.getPrototypeOf(StreamSource).call(this, tempStream));
  }

  _createClass(StreamSource, [{
    key: "close",
    value: function close() {
      _get(Object.getPrototypeOf(StreamSource.prototype), "close", this).call(this);
    }
  }]);

  return StreamSource;
}(FileSource);

function getSource(input, chunkSize) {
  if (Buffer.isBuffer(input)) {
    return new BufferSource(input);
  }

  if (input instanceof _fs.ReadStream && input.path != null) {
    return new FileSource(input);
  }

  if (input instanceof _stream.Readable) {
    return new StreamSource(input, chunkSize);
  }

  throw new Error("source object may only be an instance of Buffer or Readable in this environment");
}