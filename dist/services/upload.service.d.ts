export declare const MAX_UPLOAD_BYTES: number;
export declare const UPLOADS_DIR: string;
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
export declare function detectImageTypeFromMagicBytes(buf: Buffer): DetectedImageType | null;
/**
 * Decodes a base64 string (with or without data URI prefix) into a validated Buffer.
 */
export declare function decodeBase64Image(rawData: unknown): Buffer;
/**
 * Validates magic bytes and persists the image with a randomized UUID filename under uploads/.
 */
export declare function saveValidatedImage(buffer: Buffer): Promise<IUploadResult>;
export {};
//# sourceMappingURL=upload.service.d.ts.map