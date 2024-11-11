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

const createResponse = (statusCode: StatusCode, body: string) => {
  return `HTTP/1.1 ${statusCode}\r\nContent-Type: text/plain\r\nContent-Length: ${Buffer.byteLength(
    body
  )}\r\n\r\n${body}`;
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
  socket.on("data", (data) => {
    const requestLines = data.toString().split("\r\n");

    const parsedRequestBody = createParsedRequestBody(requestLines);
    const path = parsedRequestBody.path;
    const [, mainPath, subPath] = path.split("/");
    let response;
    let body;

    switch (path) {
      case "/":
        response = createResponse(StatusCode.OK, "Connected To server");
        break;
      case "/echo":
        response = createResponse(StatusCode.OK, "echo");
        break;
      case `/echo/${subPath}`:
        body = subPath || "echo";
        response = createResponse(StatusCode.OK, body);
        break;
      case "/user-agent":
        body = parsedRequestBody["User-Agent"] || "User-Agent not found";
        response = createResponse(StatusCode.OK, body);
        break;
      default:
        response = createResponse(StatusCode.NOT_FOUND, "Not Found");
        break;
    }

    socket.write(response);
    socket.end();
  });
});

server.listen(port, "localhost", () => {
  console.log(`Server is listening on http://localhost:${port}`);
});
