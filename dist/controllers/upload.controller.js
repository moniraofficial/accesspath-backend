"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImage = uploadImage;
const upload_service_js_1 = require("../services/upload.service.js");
const apiResponse_js_1 = require("../utils/apiResponse.js");
const apiError_js_1 = require("../utils/apiError.js");
function extractMultipartFileBuffer(body, contentType) {
    const boundaryMatch = /boundary=(?:"([^"]+)"|([^;\s]+))/i.exec(contentType);
    const boundary = boundaryMatch?.[1] || boundaryMatch?.[2];
    if (!boundary) {
        throw apiError_js_1.ApiError.badRequest("Invalid multipart/form-data boundary.");
    }
    const delimiter = Buffer.from(`--${boundary}`);
    const headerSeparator = Buffer.from("\r\n\r\n");
    let pos = body.indexOf(delimiter);
    while (pos !== -1) {
        const partStart = pos + delimiter.length;
        const nextDelimiter = body.indexOf(delimiter, partStart);
        if (nextDelimiter === -1) {
            break;
        }
        const part = body.subarray(partStart, nextDelimiter);
        const headerEnd = part.indexOf(headerSeparator);
        if (headerEnd !== -1) {
            const headersText = part.subarray(0, headerEnd).toString("utf8");
            if (/filename="/i.test(headersText)) {
                // Strip trailing \r\n before boundary
                let fileEnd = part.length;
                if (fileEnd >= 2 && part[fileEnd - 2] === 0x0d && part[fileEnd - 1] === 0x0a) {
                    fileEnd -= 2;
                }
                return part.subarray(headerEnd + headerSeparator.length, fileEnd);
            }
        }
        pos = nextDelimiter;
    }
    throw apiError_js_1.ApiError.badRequest("No file field found in multipart/form-data payload.");
}
async function uploadImage(req, res, next) {
    try {
        const contentType = (req.headers["content-type"] || "").toLowerCase();
        let imageBuffer;
        if (Buffer.isBuffer(req.body)) {
            if (contentType.startsWith("multipart/form-data")) {
                imageBuffer = extractMultipartFileBuffer(req.body, req.headers["content-type"] || "");
            }
            else {
                imageBuffer = req.body;
            }
        }
        else if (req.body && typeof req.body === "object" && "data" in req.body) {
            imageBuffer = (0, upload_service_js_1.decodeBase64Image)(req.body.data);
        }
        else {
            throw apiError_js_1.ApiError.badRequest("Provide an image via multipart/form-data, raw image/* body, or JSON { data: '<base64>' }.");
        }
        const result = await (0, upload_service_js_1.saveValidatedImage)(imageBuffer);
        (0, apiResponse_js_1.sendResponse)(res, 201, "Image uploaded successfully.", result);
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=upload.controller.js.map