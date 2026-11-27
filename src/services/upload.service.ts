import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { ApiError } from "../utils/apiError.js";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB
export const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");

export interface IUploadResult {
  url: string;
  mimeType: string;
  sizeBytes: number;
}

interface DetectedImageType {
  ext: ".png" | ".jpg" | ".webp";
  mimeType: string;
}

/**
 * Verifies image format strictly by file magic bytes (never trusts extensions or Content-Type).
 */
export function detectImageTypeFromMagicBytes(buf: Buffer): DetectedImageType | null {
  if (buf.length < 12) {
    return null;
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return { ext: ".png", mimeType: "image/png" };
  }

  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { ext: ".jpg", mimeType: "image/jpeg" };
  }

  // WebP: RIFF....WEBP
  if (
    buf.subarray(0, 4).toString("ascii") === "RIFF" &&
    buf.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return { ext: ".webp", mimeType: "image/webp" };
  }

  return null;
}

/**
 * Decodes a base64 string (with or without data URI prefix) into a validated Buffer.
 */
export function decodeBase64Image(rawData: unknown): Buffer {
  if (typeof rawData !== "string" || !rawData.trim()) {
    throw ApiError.badRequest("Image data must be a non-empty base64 string.");
  }

  let base64Part = rawData.trim();
  const dataUriMatch = /^data:image\/(?:png|jpeg|jpg|webp);base64,(.+)$/i.exec(base64Part);
  if (dataUriMatch && dataUriMatch[1]) {
    base64Part = dataUriMatch[1];
  } else if (base64Part.startsWith("data:")) {
    throw ApiError.badRequest("Unsupported data URI media type. Only PNG, JPEG, and WebP are allowed.");
  }

  const buffer = Buffer.from(base64Part, "base64");
  if (buffer.length === 0) {
    throw ApiError.badRequest("Decoded image payload is empty.");
  }
  if (buffer.length > MAX_UPLOAD_BYTES) {
    throw ApiError.badRequest("Image exceeds maximum allowed size of 5 MB.");
  }

  return buffer;
}

/**
 * Validates magic bytes and persists the image with a randomized UUID filename under uploads/.
 */
export async function saveValidatedImage(buffer: Buffer): Promise<IUploadResult> {
  if (buffer.length === 0) {
    throw ApiError.badRequest("Uploaded file is empty.");
  }
  if (buffer.length > MAX_UPLOAD_BYTES) {
    throw ApiError.badRequest("Image exceeds maximum allowed size of 5 MB.");
  }

  const detected = detectImageTypeFromMagicBytes(buffer);
  if (!detected) {
    throw ApiError.badRequest(
      "Invalid image file. Only PNG, JPEG, and WebP files verified by magic bytes are allowed."
    );
  }

  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  const filename = `${crypto.randomUUID()}${detected.ext}`;
  const targetPath = path.join(UPLOADS_DIR, filename);

  await fs.writeFile(targetPath, buffer);

  return {
    url: `/uploads/${filename}`,
    mimeType: detected.mimeType,
    sizeBytes: buffer.length,
  };
}
