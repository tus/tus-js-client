import {Readable, Transform} from "stream";
import {ReadStream, createReadStream} from "fs";

class BufferSource {
  constructor(buffer) {
    this._buffer = buffer;
    this.size = buffer.length;
  }

  slice(start, end, callback) {
    let buf = this._buffer.slice(start, end);
    buf.size = buf.length;
    callback(null, buf);
  }

  close() {}
}

class FileSource {
  constructor(stream) {
    this._stream = stream;
    this._path = stream.path.toString();
  }

  slice(start, end, callback) {
    let stream = createReadStream(this._path, {
      start: start,
      // The `end` option for createReadStream is treated inclusively
      // (see https://nodejs.org/api/fs.html#fs_fs_createreadstream_path_options).
      // However, the Buffer#slice(start, end) and also our Source#slice(start, end)
      // method treat the end range exclusively, so we have to subtract 1.
      // This prevents an off-by-one error when reporting upload progress.
      end: end - 1,
      autoClose: true
    });
    stream.size = end - start;
    callback(null, stream);
  }

  close() {
    this._stream.destroy();
  }
}

class StreamSource {
  constructor(stream, chunkSize) {
    // Ensure that chunkSize is an integer and not something else or Infinity.
    chunkSize = +chunkSize;
    if (!isFinite(chunkSize)) {
      throw new Error("cannot create source for stream without a finite value for the `chunkSize` option");
    }

    this._stream = stream;

    // Setting the size to null indicates that we have no calculation available
    // for how much data this stream will emit requiring the user to specify
    // it manually (see the `uploadSize` option).
    this.size = null;

    stream.pause();

    this._buf = new Buffer(chunkSize);
    this._bufPos = null;
    this._bufLen = 0;
  }

  slice(start, end, callback) {
    // Always attempt to drain the buffer first, even if this means that we
    // return less data, then the caller requested.
    if (start >= this._bufPos && start < (this._bufPos + this._bufLen)) {
      let bufStart = start - this._bufPos;
      let bufEnd = Math.min(this._bufLen, end - this._bufPos);
      let buf = this._buf.slice(bufStart, bufEnd);
      buf.size = buf.length;

      callback(null, buf);
      return;
    }

    // Fail fast if the caller requests a proportion of the data which is not
    // available any more.
    if (start < this._bufPos) {
      callback(new Error("cannot slice from position which we already seeked away"));
      return;
    }

    this._bufPos = start;
    this._bufLen = 0;

    let bytesToSkip = start - this._bufPos;
    let bytesToRead = end - start;
    let slicingStream = new SlicingStream(bytesToSkip, bytesToRead, this);
    this._stream.pipe(slicingStream);
    slicingStream.size = bytesToRead;

    callback(null, slicingStream);
  }

  close() {
    //this._stream.
  }
}


class SlicingStream extends Transform {
  constructor(bytesToSkip, bytesToRead, source) {
    super();

    // The number of bytes we have to discard before we start emitting data.
    this._bytesToSkip = bytesToSkip;
    // The number of bytes we will emit in the data events before ending this stream.
    this._bytesToRead = bytesToRead;
    // Points to the StreamSource object which created this SlicingStream.
    // This reference is used for manipulating the _bufLen and _buf properties
    // directly.
    this._source = source;
  }

  _transform(chunk, encoding, callback) {
    // Calculate the number of bytes we still have to skip before we can emit data.
    let bytesSkipped = Math.min(this._bytesToSkip, chunk.length);
    this._bytesToSkip -= bytesSkipped;

    // Calculate the number of bytes we can emit after we skipped enough data.
    let bytesAvailable = chunk.length - bytesSkipped;

    // If no bytes are available, because the entire chunk was skipped, we can
    // return earily.
    if (bytesAvailable === 0) {
      callback(null);
      return;
    }

    let bytesToRead = Math.min(this._bytesToRead, bytesAvailable);
    this._bytesToRead -= bytesToRead;

    if (bytesToRead !== 0) {
      let data = chunk.slice(bytesSkipped, bytesSkipped + bytesToRead);
      this._source._bufLen += data.copy(this._source._buf, this._source._bufLen);
      this.push(data);
    }

    // If we do not have to read any more bytes for this transform stream, we
    // end it and also unpipe our source, to avoid calls to _transform in the
    // future
    if (this._bytesToRead === 0) {
      this._source._stream.unpipe(this);
      this.end();
    }

    // If we did not use all the available data, we return it to the source
    // so the next SlicingStream can handle it.
    if (bytesToRead !== bytesAvailable) {
      let unusedChunk = chunk.slice(bytesSkipped + bytesToRead);
      this._source._stream.unshift(unusedChunk);
    }

    callback(null);
  }
}

export function getSource(input, chunkSize, callback) {
  if (Buffer.isBuffer(input)) {
    return callback(null, new BufferSource(input));
  }

  if (input instanceof ReadStream && input.path != null) {
    return callback(null, new FileSource(input));
  }

  if (input instanceof Readable) {
    return callback(null, new StreamSource(input, chunkSize));
  }

  callback(new Error("source object may only be an instance of Buffer or Readable in this environment"));
}
