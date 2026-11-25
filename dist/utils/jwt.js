"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTokenId = generateTokenId;
exports.hashToken = hashToken;
exports.generateAccessToken = generateAccessToken;
exports.generateRefreshToken = generateRefreshToken;
exports.verifyAccessToken = verifyAccessToken;
exports.verifyRefreshToken = verifyRefreshToken;
exports.encryptReplacementPayload = encryptReplacementPayload;
exports.decryptReplacementPayload = decryptReplacementPayload;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const node_crypto_1 = __importDefault(require("node:crypto"));
const auth_js_1 = require("../config/auth.js");
const apiError_js_1 = require("./apiError.js");
/**
 * Generates a cryptographically secure random UUID for token identifiers.
 */
function generateTokenId() {
    return node_crypto_1.default.randomUUID();
}
/**
 * Computes a SHA-256 hex digest of a token string.
 * Used for storing token hashes in MongoDB without persisting raw tokens.
 */
function hashToken(token) {
    if (!token || typeof token !== "string") {
        throw apiError_js_1.ApiError.badRequest("Token must be a non-empty string.");
    }
    return node_crypto_1.default.createHash("sha256").update(token).digest("hex");
}
/**
 * Signs a short-lived access token (15m) with dedicated JWT_SECRET.
 * Explicitly binds tokenType: "access" and session familyId.
 */
function generateAccessToken(payload) {
    const claims = {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        tokenVersion: payload.tokenVersion,
        familyId: payload.familyId,
        tokenType: "access",
    };
    return jsonwebtoken_1.default.sign(claims, auth_js_1.authConfig.jwtSecret, {
        expiresIn: auth_js_1.authConfig.accessExpiresIn,
    });
}
/**
 * Signs a long-lived refresh token (7d) with dedicated JWT_REFRESH_SECRET.
 * Explicitly binds tokenType: "refresh", jti, and familyId.
 */
function generateRefreshToken(payload) {
    const claims = {
        userId: payload.userId,
        familyId: payload.familyId,
        jti: payload.jti,
        tokenType: "refresh",
    };
    return jsonwebtoken_1.default.sign(claims, auth_js_1.authConfig.refreshSecret, {
        expiresIn: auth_js_1.authConfig.refreshExpiresIn,
    });
}
/**
 * Verifies an access token's signature, expiration, and claims.
 * Enforces tokenType: "access" and strict types on all required claims.
 */
function verifyAccessToken(token) {
    if (!token || typeof token !== "string") {
        throw apiError_js_1.ApiError.unauthorized("Authentication token required.");
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, auth_js_1.authConfig.jwtSecret);
        if (decoded.tokenType !== "access") {
            throw apiError_js_1.ApiError.unauthorized("Invalid token type: expected access token.");
        }
        if (typeof decoded.userId !== "string" || !decoded.userId ||
            typeof decoded.email !== "string" || !decoded.email ||
            typeof decoded.role !== "string" || !decoded.role ||
            typeof decoded.tokenVersion !== "number" ||
            typeof decoded.familyId !== "string" || !decoded.familyId) {
            throw apiError_js_1.ApiError.unauthorized("Invalid access token claims.");
        }
        return decoded;
    }
    catch (error) {
        if (error instanceof apiError_js_1.ApiError) {
            throw error;
        }
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            throw apiError_js_1.ApiError.unauthorized("Access token has expired.");
        }
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            throw apiError_js_1.ApiError.unauthorized("Invalid access token.");
        }
        throw apiError_js_1.ApiError.unauthorized("Token verification failed.");
    }
}
/**
 * Verifies a refresh token's signature, expiration, and claims.
 * Enforces tokenType: "refresh" and strict types on all required claims.
 */
function verifyRefreshToken(token) {
    if (!token || typeof token !== "string") {
        throw apiError_js_1.ApiError.unauthorized("Refresh token required.");
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, auth_js_1.authConfig.refreshSecret);
        if (decoded.tokenType !== "refresh") {
            throw apiError_js_1.ApiError.unauthorized("Invalid token type: expected refresh token.");
        }
        if (typeof decoded.userId !== "string" || !decoded.userId ||
            typeof decoded.familyId !== "string" || !decoded.familyId ||
            typeof decoded.jti !== "string" || !decoded.jti) {
            throw apiError_js_1.ApiError.unauthorized("Invalid refresh token claims.");
        }
        return decoded;
    }
    catch (error) {
        if (error instanceof apiError_js_1.ApiError) {
            throw error;
        }
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            throw apiError_js_1.ApiError.unauthorized("Refresh token has expired.");
        }
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            throw apiError_js_1.ApiError.unauthorized("Invalid refresh token.");
        }
        throw apiError_js_1.ApiError.unauthorized("Refresh token verification failed.");
    }
}
/**
 * Encrypts a replacement-token response payload using AES-256-GCM.
 * Uses a fresh 12-byte IV for every invocation and stores the GCM auth tag.
 * Key is derived from TOKEN_RESPONSE_ENCRYPTION_KEY, never from JWT secrets.
 */
function encryptReplacementPayload(payload, keyVersion) {
    const version = keyVersion || auth_js_1.authConfig.currentKeyVersion;
    const key = auth_js_1.authConfig.getEncryptionKey(version);
    const iv = node_crypto_1.default.randomBytes(12);
    const cipher = node_crypto_1.default.createCipheriv("aes-256-gcm", key, iv);
    const jsonPayload = JSON.stringify(payload);
    const ciphertext = Buffer.concat([cipher.update(jsonPayload, "utf8"), cipher.final()]).toString("hex");
    const authTag = cipher.getAuthTag().toString("hex");
    return {
        ciphertext,
        iv: iv.toString("hex"),
        authTag,
        keyVersion: version,
    };
}
/**
 * Decrypts an AES-256-GCM replacement-token payload.
 * Validates all hex-encoded fields before Buffer conversion.
 * Validates decrypted JSON structure before returning.
 * Verifies the GCM auth tag; handles wrong keys, tampered data, or malformed IVs safely.
 */
function decryptReplacementPayload(encrypted) {
    if (!encrypted || !encrypted.ciphertext || !encrypted.iv || !encrypted.authTag || !encrypted.keyVersion) {
        throw apiError_js_1.ApiError.unauthorized("Invalid encrypted payload structure.");
    }
    // Validate that iv, authTag, and ciphertext are valid lowercase hex strings before Buffer.from()
    const HEX_RE = /^[0-9a-fA-F]+$/;
    if (!HEX_RE.test(encrypted.iv)) {
        throw apiError_js_1.ApiError.unauthorized("Invalid initialization vector encoding.");
    }
    if (!HEX_RE.test(encrypted.authTag)) {
        throw apiError_js_1.ApiError.unauthorized("Invalid authentication tag encoding.");
    }
    if (!HEX_RE.test(encrypted.ciphertext)) {
        throw apiError_js_1.ApiError.unauthorized("Invalid ciphertext encoding.");
    }
    try {
        const key = auth_js_1.authConfig.getEncryptionKey(encrypted.keyVersion);
        const iv = Buffer.from(encrypted.iv, "hex");
        const authTag = Buffer.from(encrypted.authTag, "hex");
        if (iv.length !== 12) {
            throw apiError_js_1.ApiError.unauthorized("Invalid initialization vector length.");
        }
        const decipher = node_crypto_1.default.createDecipheriv("aes-256-gcm", key, iv);
        decipher.setAuthTag(authTag);
        const decrypted = Buffer.concat([
            decipher.update(Buffer.from(encrypted.ciphertext, "hex")),
            decipher.final(),
        ]).toString("utf8");
        // Validate decrypted JSON structure before returning
        let parsed;
        try {
            parsed = JSON.parse(decrypted);
        }
        catch {
            throw apiError_js_1.ApiError.unauthorized("Decrypted payload is not valid JSON.");
        }
        if (typeof parsed !== "object" ||
            parsed === null ||
            typeof parsed.accessToken !== "string" ||
            typeof parsed.refreshToken !== "string" ||
            !parsed.accessToken ||
            !parsed.refreshToken) {
            throw apiError_js_1.ApiError.unauthorized("Decrypted payload has invalid structure.");
        }
        return parsed;
    }
    catch (error) {
        if (error instanceof apiError_js_1.ApiError) {
            throw error;
        }
        throw apiError_js_1.ApiError.unauthorized("Failed to decrypt replacement token payload: data corrupted or key invalid.");
    }
}
//# sourceMappingURL=jwt.js.map