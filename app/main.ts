import * as net from "net";
import { StatusCode, type ParsedRequestBody } from "./types";
import { handleFileRequest } from "./utils";
import { createToken, verifyToken } from "./jwt";

const port = 4221;

const handleResponse = (
  path: string,
  subpath: string,
  parsedRequestBody: ParsedRequestBody,
  responder: Responder
) => {
  switch (path) {
    case "/":
      break;

    case "/echo":
      responder.send({ statusCode: StatusCode.OK, body: "echo" });
      return;

    case `/echo/${subpath}`:
      responder.send({ statusCode: StatusCode.OK, body: subpath || "echo" });
      return;

    case "/user-agent":
      responder.send({
        statusCode: StatusCode.OK,
        body: parsedRequestBody["User-Agent"] || "User-Agent not found",
      });
      return;

    case `/files/${subpath}`:
      responder.handleFileRequest({
        fileName: subpath,
        method: parsedRequestBody.method,
        body: parsedRequestBody.body,
      });
      return;

    case "/login":
      const { body } = parsedRequestBody || {};
      const parsedBody = JSON.parse(body);
      const { username, password } = parsedBody;
      if (username === "testuser" && password === "password123") {
        const token = createToken({ username }, Date.now() + 10000);
        responder.send({
          statusCode: StatusCode.OK,
          body: token,
          contentType: "application/json",
        });
      } else {
        responder.send({
          statusCode: StatusCode.NOT_FOUND,
          body: "Login Failed",
        });
      }
      break;

    case "/protected":
      const authHeader = parsedRequestBody.Authorization;
      const token = authHeader.split(" ")[1];
      const decodedToken = verifyToken({ token });

      if (decodedToken) {
        responder.send({
          statusCode: StatusCode.OK,
          body: "...mock-Protected Data",
        });
      } else {
        responder.send({
          statusCode: StatusCode.UNAUTHORIZED,
          body: "Unauthorized",
        });
      }
      break;

    default:
      responder.send({
        statusCode: StatusCode.NOT_FOUND,
        body: "Not Found",
      });
      break;
  }
};

const createResponseFunction = (socket: net.Socket) => {
  return (response: any) => {
    socket.write(response);
    socket.end();
  };
};

class Responder {
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

const getInformationFromRequest = ({ request }: { request: Buffer }) => {
  const requestLines = request.toString().split("\r\n");
  requestLines;
  const parsedRequestBody = createParsedRequestBody(requestLines);
  const path = parsedRequestBody.path;
  const subPath = path.split("/")?.[2];

  return {
    parsedRequestBody,
    path,
    subPath,
  };
};

const server = net.createServer((socket) => {
  socket.on("data", async (data) => {
    const { parsedRequestBody, path, subPath } = getInformationFromRequest({
      request: data,
    });

    const responder = new Responder(socket);
    handleResponse(path, subPath, parsedRequestBody, responder);
  });
});

const createResponse = ({
  statusCode,
  body,
  contentType = "text/plain",
}: {
  statusCode: StatusCode;
  body: string;
  contentType?: string;
}) => {
  const contentLength = Buffer.isBuffer(body)
    ? body.length
    : Buffer.byteLength(body);

  return `HTTP/1.1 ${statusCode}\r\nContent-Type: ${contentType}\r\nContent-Length: ${contentLength}\r\n\r\n${body}`;
};

const createParsedRequestBody = (requestLines: string[]) => {
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
