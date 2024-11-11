import { file } from "bun";
import * as net from "net";

const port = 4221;

enum StatusCode {
  "OK" = "200 OK",
  "NOT_FOUND" = "404 Not Found",
}

interface ParsedRequestBody {
  method: string;
  path: string;
  protocol: string;
  Host: string;
  Accept: string;
  "User-Agent": string;
}

const createResponse = ({
  statusCode,
  body,
  contentType = "text",
}: {
  statusCode: StatusCode;
  body: string;
  contentType?: string;
}) => {
  const contentLength = Buffer.isBuffer(body)
    ? body.length
    : Buffer.byteLength(body);

  return `HTTP/1.1 ${statusCode}\r\nContent-Type: ${contentType}/plain\r\nContent-Length: ${contentLength}\r\n\r\n${body}`;
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
    const [key, value] = line.split(": ");
    if (key && value) obj[key] = value;
  });
  return obj as ParsedRequestBody;
};

const server = net.createServer((socket) => {
  socket.on("data", async (data) => {
    const requestLines = data.toString().split("\r\n");

    const parsedRequestBody = createParsedRequestBody(requestLines);
    const path = parsedRequestBody.path;
    const [, mainPath, subPath] = path.split("/");
    let response;
    let body;

    switch (path) {
      case "/":
        response = createResponse({
          statusCode: StatusCode.OK,
          body: "Connected To server",
        });
        break;
      case "/echo":
        response = createResponse({ statusCode: StatusCode.OK, body: "echo" });
        break;
      case `/echo/${subPath}`:
        body = subPath || "echo";
        response = createResponse({ statusCode: StatusCode.OK, body: body });
        break;
      case "/user-agent":
        body = parsedRequestBody["User-Agent"] || "User-Agent not found";
        response = createResponse({ statusCode: StatusCode.OK, body: body });
        break;
      case `files/${subPath}`:
        try {
          const file = await require("fs").promises.readFile(
            `./files/tmp/${subPath}`
          );
          response = createResponse({
            statusCode: StatusCode.OK,
            body: file,
            contentType: "octet-stream",
          });
          socket.write(response);
          socket.write(file);
        } catch (err) {
          response = createResponse({
            statusCode: StatusCode.NOT_FOUND,
            body: "File not found",
          });
          socket.write(response);
        }
        break;
      default:
        response = createResponse({
          statusCode: StatusCode.NOT_FOUND,
          body: "Not Found",
        });
        break;
    }
    socket.write(response);
    socket.end();
  });
});

server.listen(port, "localhost", () => {
  console.log(`Server is listening on http://localhost:${port}`);
});
