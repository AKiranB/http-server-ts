import { promises } from "fs";
import * as fs from "fs/promises";
import * as filePath from "path";
import { StatusCode } from "./types";
import Responder from "./responder";

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

export const handleFileGet = async ({ res, fileName }: { res: Responder; fileName: string }) => {
    try {
        const file = await getFile({ fileName });
        res.setBody(file);
        res.setHeaders({
            key: "Content-Type",
            value: "application/octet-stream",
        });
        res.setStatusCode(StatusCode.OK);
    } catch (e) {
        res.setStatusCode(StatusCode.NOT_FOUND);
        res.setBody("File not found");
    }

    res.send();
};

export const getFile = async ({ fileName }: { fileName: string }) => {
    const fp = getFilePath(fileName);
    const file = await promises.readFile(fp);
    return file;
};

export const createFile = async ({ data, fileName }: { data: string; fileName: string }) => {
    const filesDir = getFolderPath();
    try {
        await fs.mkdir(filesDir, { recursive: true });
        const filePath = getFilePath(fileName);
        await fs.writeFile(filePath, data);
    } catch (err) {
        throw new Error("error creating file", err as ErrorOptions);
    }
};

export const handleFilePost = async ({
    fileName,
    body,
    res,
}: {
    fileName: string;
    body: string;
    res: Responder;
}) => {
    try {
        await createFile({ data: body, fileName });
        res.setBody("File created successfully");
        res.setStatusCode(StatusCode.CREATED);
        res.send();
    } catch (e) {
        throw new Error();
    }
};
