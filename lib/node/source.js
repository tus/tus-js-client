import {Readable} from "stream";
import {ReadStream, createReadStream} from "fs";
import {createWriteStream} from "temp";

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

class StreamSource extends FileSource {
  constructor(stream) {
    let tempStream = createWriteStream();
    stream.pipe(tempStream);
    super(tempStream);
  }

  close() {
    super.close();
  }
}

export function getSource(input, chunkSize) {
  if (Buffer.isBuffer(input)) {
    return new BufferSource(input);
  }

  if (input instanceof ReadStream && input.path != null) {
    return new FileSource(input);
  }

  if (input instanceof Readable) {
    return new StreamSource(input, chunkSize);
  }

  throw new Error("source object may only be an instance of Buffer or Readable in this environment");
}
