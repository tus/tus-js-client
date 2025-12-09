import * as http from 'node:http';
import type { HttpProgressHandler, HttpRequest, HttpResponse, HttpStack, SliceType } from '../options.js';
export declare class NodeHttpStack implements HttpStack {
    private _requestOptions;
    constructor(requestOptions?: http.RequestOptions);
    createRequest(method: string, url: string): Request;
    getName(): string;
}
declare class Request implements HttpRequest {
    private _method;
    private _url;
    private _headers;
    private _request;
    private _progressHandler;
    private _requestOptions;
    constructor(method: string, url: string, options: http.RequestOptions);
    getMethod(): string;
    getURL(): string;
    setHeader(header: string, value: string): void;
    getHeader(header: string): string;
    setProgressHandler(progressHandler: HttpProgressHandler): void;
    send(body?: SliceType): Promise<HttpResponse>;
    abort(): Promise<void>;
    getUnderlyingObject(): http.ClientRequest | null;
}
export {};
