import type { HttpRequest, HttpStack } from '../options.js';
export declare class XHRHttpStack implements HttpStack {
    createRequest(method: string, url: string): HttpRequest;
    getName(): string;
}
