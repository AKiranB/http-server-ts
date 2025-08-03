import type Responder from "./responder";
import { StatusCode } from "./types";
import { getEncodingType, parseRequestBody } from "./utils";
import { handleFileGet, handleFilePost } from "./file";

export type Req = ReturnType<typeof parseRequestBody>;

const handleResponse = (req: Req, res: Responder, subPath: string) => {
    switch (req.path) {
        case "/":
            res.setStatusCode(StatusCode.OK);
            res.send();
            break;

        case "/echo":
            res.setBody("echo");
            res.setStatusCode(StatusCode.OK);
            res.send();
            return;

        case `/echo/${subPath}`:
            const supportedEncodingType = getEncodingType(req["Accept-Encoding"]);

            if (supportedEncodingType) {
                res.setHeaders({
                    key: "Accept-Encoding",
                    value: supportedEncodingType,
                });
                res.setHeaders({
                    key: "Content-Encoding",
                    value: supportedEncodingType,
                });
            }

            res.setHeaders({
                key: "Content-Type",
                value: "text/plain",
            });
            res.setBody(subPath || "echo");
            res.setStatusCode(StatusCode.OK);
            res.send();
            return;

        case "/user-agent":
            res.setBody(req["User-Agent"] || "User-Agent not found");
            res.setStatusCode(StatusCode.OK);
            res.send();
            return;

        case `/files/${subPath}`:
            const method = req.method;
            if (method === "GET") {
                handleFileGet({ fileName: subPath, res });
                return;
            }

            handleFilePost({
                fileName: subPath,
                res,
                body: req.body,
            });
            return;

        default:
            res.setStatusCode(StatusCode.NOT_FOUND);
            res.setBody("Not Found");
            res.send();
            break;
    }
};

export default handleResponse;
