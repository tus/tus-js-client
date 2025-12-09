import type { HttpProgressHandler, HttpRequest, HttpResponse, HttpStack, SliceType } from '../options.js';
export declare class FetchHttpStack implements HttpStack {
    createRequest(method: string, url: string): FetchRequest;
    getName(): string;
}
declare class FetchRequest implements HttpRequest {
    private _method;
    private _url;
    private _headers;
    private _controller;
    constructor(method: string, url: string);
    getMethod(): string;
    getURL(): string;
    setHeader(header: string, value: string): void;
    getHeader(header: string): string;
    setProgressHandler(_progressHandler: HttpProgressHandler): void;
    send(body?: SliceType): Promise<FetchResponse>;
    abort(): Promise<void>;
    getUnderlyingObject(): undefined;
}
declare class FetchResponse implements HttpResponse {
    private _res;
    private _body;
    constructor(res: Response, body: string);
    getStatus(): number;
    getHeader(header: string): string | undefined;
    getBody(): string;
    getUnderlyingObject(): Response;
}
export {};
