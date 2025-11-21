/**
 * readAsByteArray converts a File/Blob object to a Uint8Array.
 * This function is only used on the Apache Cordova platform.
 * See https://cordova.apache.org/docs/en/latest/reference/cordova-plugin-file/index.html#read-a-file
 */
export declare function readAsByteArray(chunk: Blob): Promise<Uint8Array>;
