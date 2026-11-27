"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UPLOADS_DIR = exports.MAX_UPLOAD_BYTES = void 0;
exports.detectImageTypeFromMagicBytes = detectImageTypeFromMagicBytes;
exports.decodeBase64Image = decodeBase64Image;
exports.saveValidatedImage = saveValidatedImage;
const node_crypto_1 = __importDefault(require("node:crypto"));
const promises_1 = __importDefault(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
const apiError_js_1 = require("../utils/apiError.js");
exports.MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB
exports.UPLOADS_DIR = node_path_1.default.resolve(process.cwd(), "uploads");
/**
 * Verifies image format strictly by file magic bytes (never trusts extensions or Content-Type).
 */
function detectImageTypeFromMagicBytes(buf) {
    if (buf.length < 12) {
        return null;
    }
    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (buf[0] === 0x89 &&
        buf[1] === 0x50 &&
        buf[2] === 0x4e &&
        buf[3] === 0x47 &&
        buf[4] === 0x0d &&
        buf[5] === 0x0a &&
        buf[6] === 0x1a &&
        buf[7] === 0x0a) {
        return { ext: ".png", mimeType: "image/png" };
    }
    // JPEG: FF D8 FF
    if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
        return { ext: ".jpg", mimeType: "image/jpeg" };
    }
    // WebP: RIFF....WEBP
    if (buf.subarray(0, 4).toString("ascii") === "RIFF" &&
        buf.subarray(8, 12).toString("ascii") === "WEBP") {
        return { ext: ".webp", mimeType: "image/webp" };
    }
    return null;
}
/**
 * Decodes a base64 string (with or without data URI prefix) into a validated Buffer.
 */
function decodeBase64Image(rawData) {
    if (typeof rawData !== "string" || !rawData.trim()) {
        throw apiError_js_1.ApiError.badRequest("Image data must be a non-empty base64 string.");
    }
    let base64Part = rawData.trim();
    const dataUriMatch = /^data:image\/(?:png|jpeg|jpg|webp);base64,(.+)$/i.exec(base64Part);
    if (dataUriMatch && dataUriMatch[1]) {
        base64Part = dataUriMatch[1];
    }
    else if (base64Part.startsWith("data:")) {
        throw apiError_js_1.ApiError.badRequest("Unsupported data URI media type. Only PNG, JPEG, and WebP are allowed.");
    }
    const buffer = Buffer.from(base64Part, "base64");
    if (buffer.length === 0) {
        throw apiError_js_1.ApiError.badRequest("Decoded image payload is empty.");
    }
    if (buffer.length > exports.MAX_UPLOAD_BYTES) {
        throw apiError_js_1.ApiError.badRequest("Image exceeds maximum allowed size of 5 MB.");
    }
    return buffer;
}
/**
 * Validates magic bytes and persists the image with a randomized UUID filename under uploads/.
 */
async function saveValidatedImage(buffer) {
    if (buffer.length === 0) {
        throw apiError_js_1.ApiError.badRequest("Uploaded file is empty.");
    }
    if (buffer.length > exports.MAX_UPLOAD_BYTES) {
        throw apiError_js_1.ApiError.badRequest("Image exceeds maximum allowed size of 5 MB.");
    }
    const detected = detectImageTypeFromMagicBytes(buffer);
    if (!detected) {
        throw apiError_js_1.ApiError.badRequest("Invalid image file. Only PNG, JPEG, and WebP files verified by magic bytes are allowed.");
    }
    await promises_1.default.mkdir(exports.UPLOADS_DIR, { recursive: true });
    const filename = `${node_crypto_1.default.randomUUID()}${detected.ext}`;
    const targetPath = node_path_1.default.join(exports.UPLOADS_DIR, filename);
    await promises_1.default.writeFile(targetPath, buffer);
    return {
        url: `/uploads/${filename}`,
        mimeType: detected.mimeType,
        sizeBytes: buffer.length,
    };
}
//# sourceMappingURL=upload.service.js.map