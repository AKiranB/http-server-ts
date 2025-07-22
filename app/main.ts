import * as net from "net";
import { StatusCode, type ParsedRequestBody } from "./types";
import { createToken, verifyToken } from "./jwt";
import Responder from "./responder";

const port = 4221;

const handleResponse = (
    req: ReturnType<typeof parseRequestBody>,
    res: Responder,
    subPath: string
) => {
    switch (req.path) {
        case "/":
            break;

        case "/echo":
            res.send({ statusCode: StatusCode.OK, body: "echo" });
            return;

        case `/echo/${subPath}`:
            res.send({ statusCode: StatusCode.OK, body: subPath || "echo" });
            return;

        case "/user-agent":
            res.send({
                statusCode: StatusCode.OK,
                body: req["User-Agent"] || "User-Agent not found",
            });
            return;

        case `/files/${subPath}`:
            res.handleFileRequest({
                fileName: subPath,
                method: req.method,
                body: req.body,
            });
            return;

        case "/login":
            const { body } = req || {};
            const parsedBody = JSON.parse(body);
            const { username, password } = parsedBody;
            if (username === "testuser" && password === "password123") {
                const token = createToken({ username }, Date.now() + 10000);
                res.send({
                    statusCode: StatusCode.OK,
                    body: token,
                    contentType: "application/json",
                });
            } else {
                res.send({
                    statusCode: StatusCode.NOT_FOUND,
                    body: "Login Failed",
                });
            }
            break;

        case "/protected":
            const authHeader = req.Authorization;
            const token = authHeader.split(" ")[1];
            const decodedToken = verifyToken({ token });

            if (decodedToken) {
                res.send({
                    statusCode: StatusCode.OK,
                    body: "...mock-Protected Data",
                });
            } else {
                res.send({
                    statusCode: StatusCode.UNAUTHORIZED,
                    body: "Unauthorized",
                });
            }
            break;

        default:
            res.send({
                statusCode: StatusCode.NOT_FOUND,
                body: "Not Found",
            });
            break;
    }
};

const getInformationFromRequest = ({ request }: { request: Buffer }) => {
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

const server = net.createServer((socket) => {
    socket.on("data", async (data) => {
        const { req, subPath } = getInformationFromRequest({
            request: data,
        });

        const res = new Responder(socket);
        handleResponse(req, res, subPath);
    });
});

const parseRequestBody = (requestLines: string[]) => {
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

server.listen(port, "localhost", () => {
    console.log(`Server is listening on http://localhost:${port}`);
});
