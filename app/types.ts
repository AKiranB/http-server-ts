import type { createResponseHeader } from "./responder";

export enum StatusCode {
    "OK" = "200 OK",
    "NOT_FOUND" = "404 Not Found",
    "UNAUTHORIZED" = "401 Unauthorized",
    "INTERNAL_SERVER_ERROR" = "500 Internal Server Error",
    "CREATED" = "201 Created",
}

export interface ParsedRequestBody {
    method: string;
    path: string;
    protocol: string;
    Host: string;
    Accept: string;
    Authorization: string;
    "Content-type": string;
    "Content-Length": string;
    "User-Agent": string;
    "Accept-Encoding": string;
    body: string;
}

export type Response = ReturnType<typeof createResponseHeader>;
