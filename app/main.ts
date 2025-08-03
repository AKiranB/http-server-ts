import * as net from "net";
import Responder from "./responder";
import { PORT } from "./constants";
import { getInformationFromRequest } from "./utils";
import handleResponse from "./handleResponse";

const server = net.createServer((socket) => {
    socket.on("data", async (data) => {
        const { req, subPath } = getInformationFromRequest({
            request: data,
        });
        const res = new Responder(socket);
        handleResponse(req, res, subPath);
    });
});

server.listen(PORT, "localhost", () => {
    console.log(`Server is listening on http://localhost:${PORT}`);
});
