import type { HttpRequest, HttpResponse } from './options.js';
export declare class DetailedError extends Error {
    originalRequest?: HttpRequest;
    originalResponse?: HttpResponse;
    causingError?: Error;
    constructor(message: string, causingErr?: Error, req?: HttpRequest, res?: HttpResponse);
}
