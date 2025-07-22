import * as net from "net";
import * as fs from "fs/promises";
import * as filePath from "path";
import { StatusCode } from "./types";
import { createResponse } from "./responder";

export const getFolderPath = () => {
    const args = process.argv;
    const directoryFlagIndex = args.indexOf("--directory");
    const pathArgs = directoryFlagIndex !== -1 ? args[directoryFlagIndex + 1] : "./files";

    return pathArgs;
};

export const getFilePath = (fileName: string) => {
    const pathArgs = getFolderPath();
    return filePath.join(pathArgs, fileName);
};

export const handleFileGet = async ({
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

export const handleFilePost = async ({ data, fileName }: { data: string; fileName: string }) => {
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
        await handleFileGet({
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

    handleFilePost({
        data: body,
        fileName,
    });
    const response = createResponse({
        statusCode: StatusCode.CREATED,
        body: "File created successfully",
    });

    socket.write(response);
};
