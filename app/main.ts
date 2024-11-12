import * as net from "net";
import * as fs from "fs/promises";
import * as filePath from "path";

const port = 4221;

enum StatusCode {
  "OK" = "200 OK",
  "NOT_FOUND" = "404 Not Found",
  "INTERNAL_SERVER_ERROR" = "500 Internal Server Error",
  "CREATED" = "201 Created",
}

interface ParsedRequestBody {
  method: string;
  path: string;
  protocol: string;
  Host: string;
  Accept: string;
  "Content-type": string;
  "Content-Length": string;
  "User-Agent": string;
  body: string;
}

const handleFileGetRequest = async ({
  fileName,
  onSuccess,
  onFailure,
}: {
  fileName: string;
  onSuccess: (respons: any, file: any) => void;
  onFailure: (response: any) => void;
}) => {
  let response;
  try {
    const fp = getFilePath(fileName);
    const file = await require("fs").promises.readFile(fp);
    response = createResponse({
      statusCode: StatusCode.OK,
      body: file,
      contentType: "application/octet-stream",
    });
    onSuccess(response, file);
  } catch (err) {
    response = createResponse({
      statusCode: StatusCode.NOT_FOUND,
      body: "File not found",
    });
    onFailure(response);
  }
};

const getFolderPath = () => {
  const args = process.argv;
  const directoryFlagIndex = args.indexOf("--directory");
  const pathArgs =
    directoryFlagIndex !== -1 ? args[directoryFlagIndex + 1] : "./files";

  return pathArgs;
};

const getFilePath = (fileName: string) => {
  const pathArgs = getFolderPath();
  return filePath.join(pathArgs, fileName);
};

const handleFilePostRequest = async ({
  data,
  fileName,
}: {
  data: string;
  fileName: string;
}) => {
  const filesDir = getFolderPath();
  try {
    await fs.mkdir(filesDir, { recursive: true });
    const filePath = getFilePath(fileName);
    await fs.writeFile(filePath, data);
  } catch (err) {
    throw new Error("error creating file", err as ErrorOptions);
  }
};

const handleFileRequest = async (
  fileName: string,
  method: string,
  body: string,
  socket: net.Socket
) => {
  if (method === "GET") {
    await handleFileGetRequest({
      fileName,
      onSuccess: (response, file) => {
        socket.write(response);
        socket.write(file);
      },
      onFailure: (response) => {
        socket.write(response);
      },
    });
  }

  handleFilePostRequest({
    data: body,
    fileName,
  });
  const response = createResponse({
    statusCode: StatusCode.CREATED,
    body: "File created successfully",
  });

  socket.write(response);
};

const server = net.createServer((socket) => {
  socket.on("data", async (data) => {
    const requestLines = data.toString().split("\r\n");
    const parsedRequestBody = createParsedRequestBody(requestLines);
    const path = parsedRequestBody.path;
    const subPath = path.split("/")?.[2];

    let response;

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
        response = createResponse({
          statusCode: StatusCode.OK,
          body: subPath || "echo",
        });
        break;

      case "/user-agent":
        response = createResponse({
          statusCode: StatusCode.OK,
          body: parsedRequestBody["User-Agent"] || "User-Agent not found",
        });
        break;

      case `/files/${subPath}`:
        await handleFileRequest(
          subPath,
          parsedRequestBody.method,
          parsedRequestBody.body,
          socket
        );
        break;

      default:
        response = createResponse({
          statusCode: StatusCode.NOT_FOUND,
          body: "Not Found",
        });
        break;
    }
    socket.write(response ?? "");
    socket.end();
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
