import type { ParsedRequestBody } from "./types";
import zlib from "node:zlib";

const acceptedEncodings = ["gzip", "deflate", "br", "identity"];

export const getEncodingType = (clientEncodingHeader?: string) => {
    if (!clientEncodingHeader) return null;
    const encodingRequestOptions = clientEncodingHeader
        .split(",")
        .map((encoding) => encoding.trim());

    const supportedEncoding = encodingRequestOptions.find((encoding) =>
        acceptedEncodings.includes(encoding)
    );

    if (supportedEncoding) {
        return supportedEncoding;
    }
    return null;
};

export const getContentLength = (body: string | Buffer) => {
    const contentLength = Buffer.isBuffer(body) ? body.length : Buffer.byteLength(body);
    return contentLength;
};

export const parseRequestBody = (requestLines: string[]) => {
    const obj: Record<string, any> = {};
    requestLines.forEach((line: string, index) => {
        if (index === 0) {
            const [method, path, protocol] = line.split(" ");
            obj["method"] = method;
            obj["path"] = path;
            obj["protocol"] = protocol;
        }
        if (index === requestLines.length - 1) {
            return (obj["body"] = line);
        }
        const [key, value] = line.split(": ");
        if (key && value) obj[key] = value;
    });
    return obj as ParsedRequestBody;
};

export const getInformationFromRequest = ({ request }: { request: Buffer }) => {
    const requestLines = request.toString().split("\r\n");
    requestLines;
    const req = parseRequestBody(requestLines);
    const path = req.path;
    const subPath = path.split("/")?.[2];

    return {
        req,
        subPath,
    };
};

// We can use buffer.from here, but I wanted to understand the algorithm a little better
export const convertHexToBuffer = (hex: string) => {
    const bytes = [];
    for (let i = 0; i < hex.length; i += 2) {
        bytes.push(hex.slice(i, i + 2));
    }
    const binary = bytes.map((b) => {
        return parseInt(b, 16);
    });
    return Buffer.from(binary);
};
