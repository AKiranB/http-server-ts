import type { StatusCode } from "./types";
import * as net from "net";
import { handleFileRequest } from "./file";

export const createResponseFunction = (socket: net.Socket) => {
    return (response: any) => {
        socket.write(response);
        socket.end();
    };
};

export const createResponse = ({
    statusCode,
    body,
    contentType = "text/plain",
}: {
    statusCode: StatusCode;
    body: string;
    contentType?: string;
}) => {
    const contentLength = Buffer.isBuffer(body) ? body.length : Buffer.byteLength(body);
    return `HTTP/1.1 ${statusCode}\r\nContent-Type: ${contentType}\r\nContent-Length: ${contentLength}\r\n\r\n${body}`;
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
    }: {
        statusCode: StatusCode;
        body: string;
        contentType?: string;
    }) {
        const response = createResponse({ statusCode, body, contentType });
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
