import { FileSource, ReactNativeFile, SliceResult, UploadOptions } from "../options.js";

export class ReactNativeFileSource implements FileSource {
  private readonly _file: ReactNativeFile
  size: number;

  constructor(file: ReactNativeFile) {
    this._file = file
    this.size = Number(file.size)
  }

  fingerprint(options: UploadOptions): Promise<string | null> {
    if (typeof options.fingerprint === 'function') {
      return Promise.resolve(options.fingerprint(this._file, options))
    }

    return Promise.resolve(this.reactNativeFingerprint(this._file, options))
  }

  // TODO: Implement the slice method to read file content from start to end positions
  // The implementation should:
  // 1. Read the file content from the ReactNative file URI
  // 2. Return the sliced content as value
  // 3. Calculate proper size and done values
  async slice(start: number, end: number): Promise<SliceResult> {
    let value = null, size = null, done = true;

    return { value, size, done }
  }

  close(): void {
    // Nothing to do here since we don't need to release any resources.
  }

  private reactNativeFingerprint(file: ReactNativeFile, options: UploadOptions): string {
    const exifHash = file.exif ? this.hashCode(JSON.stringify(file.exif)) : 'noexif'
    return ['tus-rn', file.name || 'noname', file.size || 'nosize', exifHash, options.endpoint].join(
        '/',
    )
  }

  private hashCode(str: string): number {
    // from https://stackoverflow.com/a/8831937/151666
    let hash = 0
    if (str.length === 0) {
      return hash
    }
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash &= hash // Convert to 32bit integer
    }
    return hash
  }
}
