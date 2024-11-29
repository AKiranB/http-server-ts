import * as net from "net";
import * as fs from "fs/promises";
import * as filePath from "path";
import { StatusCode } from "./types";

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

export const handleFileGetRequest = async ({
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

export const handleFilePostRequest = async ({
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

export const handleFileRequest = async (
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
