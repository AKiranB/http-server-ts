import * as net from "net";

console.log("Logs from your program will appear here!");

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
    const request = data.toString();
    const [, path] = request.split(" ");
    const [, mainRoute, subRoute] = path.split("/");

    let response;

    if (path === "/") {
      response = createResponse(StatusCode.OK, "Hello, World!");
    } else if (mainRoute === "echo" && subRoute) {
      const body = `Echo: ${subRoute}`;
      response = createResponse(StatusCode.OK, body);
    } else {
      response = createResponse(StatusCode.NOT_FOUND, "Not Found");
    }
    socket.write(response);
    socket.end();
  });
});

server.listen(port, "localhost", () => {
  console.log(`Server is listening on http://localhost:${port}`);
});
