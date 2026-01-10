/**
 * Generate a UUID v4 based on random numbers. We intentioanlly use the less
 * secure Math.random function here since the more secure crypto.getRandomNumbers
 * is not available on all platforms.
 * This is not a problem for us since we use the UUID only for generating a
 * request ID, so we can correlate server logs to client errors.
 *
 * This function is taken from following site:
 * https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
 *
 * @return {string} The generate UUID
 */
export declare function uuid(): string;
