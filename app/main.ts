import * as net from "net";

console.log("Logs from your program will appear here!");

const port = 4221;

const server = net.createServer((socket) => {
  socket.write(`HTTP/1.1 200 OK\r\n\r\n`);
  socket.on("close", () => {
    socket.end();
  });
});

server.listen(port, "localhost");
