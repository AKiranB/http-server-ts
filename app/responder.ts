import type { StatusCode } from "./types";
import * as net from "net";
import { handleFileRequest } from "./file";

export const createResponseFunction = (socket: net.Socket) => {
    return (response: any) => {
        socket.write(response);
        socket.end();
    };
};

const createHeaderObject = (
    contentType: string | undefined,
    encodingType: string | undefined,
    contentLength: number | undefined
) => {
    return {
        "Content-Type": contentType,
        "Content-Length": contentLength,
        "Content-Encoding": encodingType,
    };
};

const createHeaders = (headerObject: ReturnType<typeof createHeaderObject>) => {
    let headers = "";

    for (const prop in headerObject) {
        const key = prop as keyof ReturnType<typeof createHeaderObject>;
        if (!headerObject[key]) continue;
        headers += `${prop}:${headerObject[key]}\r\n`;
    }

    return headers;
};

const getContentLength = (body: string | Buffer | undefined) => {
    if (!body) return undefined;
    const contentLength = Buffer.isBuffer(body) ? body.length : Buffer.byteLength(body);
    return contentLength;
};

export const createResponse = ({
    body,
    statusCode,
    contentType,
    encodingType,
}: {
    body?: string;
    statusCode: StatusCode;
    contentType?: string;
    encodingType?: string;
}) => {
    const contentLength = getContentLength(body);
    const headerObject = createHeaderObject(contentType, encodingType, contentLength);
    const headers = createHeaders(headerObject);
    const response = `HTTP/1.1 ${statusCode}\r\n${headers}\r\n`;

    return body ? `${response}${body}` : response;
};

export default class Responder {
    private socket: net.Socket;

    constructor(socket: net.Socket) {
        this.socket = socket;
    }

    send({
        statusCode,
        body,
        contentType = "text/plain",
        encodingType,
    }: {
        statusCode: StatusCode;
        body?: string;
        contentType?: string;
        encodingType?: string;
    }) {
        const response = createResponse({ body, statusCode, contentType, encodingType });
        const respond = createResponseFunction(this.socket);
        respond(response);
    }

    handleFileRequest({
        fileName,
        method,
        body,
    }: {
        fileName: string;
        method: string;
        body: string;
    }) {
        handleFileRequest(fileName, method, body, this.socket);
    }
}
