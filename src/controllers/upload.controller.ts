import type { Request, Response, NextFunction } from "express";
import {
  decodeBase64Image,
  saveValidatedImage,
} from "../services/upload.service.js";
import { sendResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";

function extractMultipartFileBuffer(body: Buffer, contentType: string): Buffer {
  const boundaryMatch = /boundary=(?:"([^"]+)"|([^;\s]+))/i.exec(contentType);
  const boundary = boundaryMatch?.[1] || boundaryMatch?.[2];
  if (!boundary) {
    throw ApiError.badRequest("Invalid multipart/form-data boundary.");
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

  throw ApiError.badRequest("No file field found in multipart/form-data payload.");
}

export async function uploadImage(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const contentType = (req.headers["content-type"] || "").toLowerCase();
    let imageBuffer: Buffer;

    if (Buffer.isBuffer(req.body)) {
      if (contentType.startsWith("multipart/form-data")) {
        imageBuffer = extractMultipartFileBuffer(req.body, req.headers["content-type"] || "");
      } else {
        imageBuffer = req.body;
      }
    } else if (req.body && typeof req.body === "object" && "data" in req.body) {
      imageBuffer = decodeBase64Image((req.body as Record<string, unknown>).data);
    } else {
      throw ApiError.badRequest(
        "Provide an image via multipart/form-data, raw image/* body, or JSON { data: '<base64>' }."
      );
    }

    const result = await saveValidatedImage(imageBuffer);
    sendResponse(res, 201, "Image uploaded successfully.", result);
  } catch (error: unknown) {
    next(error);
  }
}
