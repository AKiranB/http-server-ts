export const createHeaderObject = (
    contentType: string | undefined,
    encodingType: string | undefined,
    contentLength: number | undefined
) => {
    return {
        "Content-Type": contentType,
        "Content-Length": contentLength,
        "Content-Encoding": encodingType,
    };
};

export const createHeaders = (headerObject: Map<string, string | number>) => {
    let headers = "";

    for (const [key, value] of headerObject) {
        if (!headerObject.has(key)) continue;
        headers += `${key}:${value}\r\n`;
    }

    return headers;
};
