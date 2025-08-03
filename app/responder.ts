import type { StatusCode } from "./types";
import * as net from "net";
import { createHeaders } from "./headers";
import { convertHexToBuffer, getContentLength } from "./utils";

export const createResponseFunction = (socket: net.Socket) => {
    return ({ responseHeader, body }: { responseHeader: string; body?: string | Buffer }) => {
        socket.write(responseHeader);
        if (body) socket.write(body);
        socket.end();
    };
};

const compressIfNeeded = ({ body, encodingType }: { body?: string; encodingType?: string }) => {
    if (!body) return;
    return encodingType ? convertHexToBuffer(body) : body;
};

const HTTP_VERSION = "HTTP/1.1";

export const createResponseHeader = ({
    statusCode,
    headers,
}: {
    headers: string;
    statusCode: StatusCode | null;
}) => {
    const response = `${HTTP_VERSION} ${statusCode}\r\n${headers}\r\n`;
    return response;
};

export default class Responder {
    private socket: net.Socket;
    private respond: (response: any) => void;
    private headers: Map<string, string | number>;
    private body: string | Buffer | null;
    private statusCode: StatusCode | null;

    constructor(socket: net.Socket) {
        this.socket = socket;
        this.respond = createResponseFunction(this.socket);
        this.headers = new Map();
        this.body = null;
        this.statusCode = null;
    }

    setHeaders(header: { key: string; value: string }) {
        const { key, value } = header;
        this.headers.set(key, value);
    }

    setBody(body: string | Buffer) {
        this.body = body;
    }

    setStatusCode(statusCode: StatusCode) {
        this.statusCode = statusCode;
    }

    send() {
        if (!this.headers.has("Content-Length") && this.body) {
            this.headers.set("Content-Length", getContentLength(this.body));
        }
        const headers = createHeaders(this.headers);

        const responseHeader = createResponseHeader({
            headers,
            statusCode: this.statusCode,
        });

        this.respond({ responseHeader, body: this.body });
    }
}
