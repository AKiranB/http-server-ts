import * as net from "net";

console.log("Logs from your program will appear here!");

const port = 4221;

const server = net.createServer((socket) => {
  socket.write(`HTTP/1.1 200 OK\r\n`);
  socket.write(`Content-Type: text/plain\r\n`);
  socket.write(`Content-Length: 13\r\n`);
  socket.write(`\r\n`);
  socket.write(`Hello, World!`);

  socket.on("data", (data) => {
    const req = data.toString();

    const [method, path] = req.split(" ");

    if (path !== "/") {
      return 404;
    }

    return 200;
  });

  socket.end();
});

server.listen(port, "localhost", () => {
  console.log(`Server is listening on http://localhost:${port}`);
});
