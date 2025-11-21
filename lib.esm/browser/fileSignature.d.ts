import type { UploadInput, UploadOptions } from '../options.js';
/**
 * Generate a fingerprint for a file which will be used the store the endpoint
 */
export declare function fingerprint(file: UploadInput, options: UploadOptions): Promise<string> | Promise<null>;
