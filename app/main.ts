import * as net from "net";

const port = 4221;

enum StatusCode {
  "OK" = "200 OK",
  "NOT_FOUND" = "404 Not Found",
}

const createResponse = (statusCode: StatusCode, body: string) => {
  return `HTTP/1.1 ${statusCode}\r\nContent-Type: text/plain\r\nContent-Length: ${Buffer.byteLength(
    body
  )}\r\n\r\n${body}`;
};

const server = net.createServer((socket) => {
  socket.on("data", (data) => {
    const request = data.toString().split(" ");

    const path = request[1];
    const paths = path.split("/");
    const subRoute = paths[2];

    let response;
    let body;

    switch (path) {
      case "/":
        response = createResponse(StatusCode.OK, "Connected To server");
        break;
      case "/echo":
        response = createResponse(StatusCode.OK, "echo");
        break;
      case `/echo/${subRoute}`:
        body = `${subRoute}`;
        response = createResponse(StatusCode.OK, body);
        break;
      case "/user-agent":
        body = request[request.length - 1];
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
