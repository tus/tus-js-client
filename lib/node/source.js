import {PassThrough} from "stream";
import {ReadStream, createReadStream} from "fs";
import {DiscardStream, MeterStream} from "common-streams";

class BufferSource {
  constructor(buffer) {
    this._buffer = buffer;
    this.size = buffer.length;
  }

  slice(start, end) {
    let buf = this._buffer.slice(start, end);
    buf.size = buf.length;
    return buf;
  }

  close() {}
}

class FileSource {
  constructor(stream) {
    this._stream = stream;
    this._path = stream.path.toString();
  }

  slice(start, end) {
    let stream = createReadStream(this._path, {
      start: start,
      end: end,
      autoClose: true
    });
    stream.size = end - start;
    return stream;
  }

  close() {
    this._stream.destroy();
  }
}

class StreamSource {
  constructor(stream) {
    // "block" stream
    this._stream = stream.pipe(new PassThrough());
    // Setting the size to null indicates that we have no calculation available
    // for how much data this stream will emit requiring the user to specify
    // it manually (see the `uploadSize` option).
    this.size = null;
  }

  slice(start, end) {
    const slicingStream = this._stream
      .pipe(new DiscardStream(start))
      .pipe(new MeterStream(end))
      .on("error", (err) => {
        if (err instanceof MeterStream.OverflowError) {
          slicingStream.end();
        }
      })
      // dont make meterstream error visible to outside...
      .pipe(new PassThrough());
    slicingStream.size = end - start;
    return slicingStream;
  }

  close() {
    // https://github.com/mafintosh/pump/blob/master/index.js#L39 ?
    //this._stream.
  }
}

export function getSource(input) {
  if (Buffer.isBuffer(input)) {
    return new BufferSource(input);
  }

  if (input instanceof ReadStream && input.path != null) {
    return new FileSource(input);
  }

  // instanceof Readable will not work with some streams
  // maybe use https://github.com/sindresorhus/is-stream#isstreamreadablestream ?
  if (typeof input.pipe === "function") {
    return new StreamSource(input);
  }

  throw new Error("source object may only be an instance of Buffer or Readable in this environment");
}
