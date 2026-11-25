import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { authConfig } from "../config/auth.js";
import { UserRoleType } from "../config/roles.js";
import { ApiError } from "./apiError.js";

export interface IAccessTokenSignPayload {
  userId: string;
  email: string;
  role: UserRoleType;
  tokenVersion: number;
  familyId: string;
}

export interface IRefreshTokenSignPayload {
  userId: string;
  familyId: string;
  jti: string;
}

export interface IAccessTokenClaims extends IAccessTokenSignPayload {
  tokenType: "access";
  iat: number;
  exp: number;
}

export interface IRefreshTokenClaims extends IRefreshTokenSignPayload {
  tokenType: "refresh";
  iat: number;
  exp: number;
}

export interface IReplacementPayload {
  accessToken: string;
  refreshToken: string;
}

export interface IEncryptedPayload {
  ciphertext: string;
  iv: string;
  authTag: string;
  keyVersion: string;
}

/**
 * Generates a cryptographically secure random UUID for token identifiers.
 */
export function generateTokenId(): string {
  return crypto.randomUUID();
}

/**
 * Computes a SHA-256 hex digest of a token string.
 * Used for storing token hashes in MongoDB without persisting raw tokens.
 */
export function hashToken(token: string): string {
  if (!token || typeof token !== "string") {
    throw ApiError.badRequest("Token must be a non-empty string.");
  }
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Signs a short-lived access token (15m) with dedicated JWT_SECRET.
 * Explicitly binds tokenType: "access" and session familyId.
 */
export function generateAccessToken(payload: IAccessTokenSignPayload): string {
  const claims = {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    tokenVersion: payload.tokenVersion,
    familyId: payload.familyId,
    tokenType: "access" as const,
  };

  return jwt.sign(claims, authConfig.jwtSecret, {
    expiresIn: authConfig.accessExpiresIn as any,
  });
}

/**
 * Signs a long-lived refresh token (7d) with dedicated JWT_REFRESH_SECRET.
 * Explicitly binds tokenType: "refresh", jti, and familyId.
 */
export function generateRefreshToken(payload: IRefreshTokenSignPayload): string {
  const claims = {
    userId: payload.userId,
    familyId: payload.familyId,
    jti: payload.jti,
    tokenType: "refresh" as const,
  };

  return jwt.sign(claims, authConfig.refreshSecret, {
    expiresIn: authConfig.refreshExpiresIn as any,
  });
}

/**
 * Verifies an access token's signature, expiration, and claims.
 * Enforces tokenType: "access" and strict types on all required claims.
 */
export function verifyAccessToken(token: string): IAccessTokenClaims {
  if (!token || typeof token !== "string") {
    throw ApiError.unauthorized("Authentication token required.");
  }

  try {
    const decoded = jwt.verify(token, authConfig.jwtSecret) as Record<string, unknown>;

    if (decoded.tokenType !== "access") {
      throw ApiError.unauthorized("Invalid token type: expected access token.");
    }

    if (
      typeof decoded.userId !== "string" || !decoded.userId ||
      typeof decoded.email !== "string" || !decoded.email ||
      typeof decoded.role !== "string" || !decoded.role ||
      typeof decoded.tokenVersion !== "number" ||
      typeof decoded.familyId !== "string" || !decoded.familyId
    ) {
      throw ApiError.unauthorized("Invalid access token claims.");
    }

    return decoded as unknown as IAccessTokenClaims;
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw ApiError.unauthorized("Access token has expired.");
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw ApiError.unauthorized("Invalid access token.");
    }
    throw ApiError.unauthorized("Token verification failed.");
  }
}

/**
 * Verifies a refresh token's signature, expiration, and claims.
 * Enforces tokenType: "refresh" and strict types on all required claims.
 */
export function verifyRefreshToken(token: string): IRefreshTokenClaims {
  if (!token || typeof token !== "string") {
    throw ApiError.unauthorized("Refresh token required.");
  }

  try {
    const decoded = jwt.verify(token, authConfig.refreshSecret) as Record<string, unknown>;

    if (decoded.tokenType !== "refresh") {
      throw ApiError.unauthorized("Invalid token type: expected refresh token.");
    }

    if (
      typeof decoded.userId !== "string" || !decoded.userId ||
      typeof decoded.familyId !== "string" || !decoded.familyId ||
      typeof decoded.jti !== "string" || !decoded.jti
    ) {
      throw ApiError.unauthorized("Invalid refresh token claims.");
    }

    return decoded as unknown as IRefreshTokenClaims;
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw ApiError.unauthorized("Refresh token has expired.");
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw ApiError.unauthorized("Invalid refresh token.");
    }
    throw ApiError.unauthorized("Refresh token verification failed.");
  }
}

/**
 * Encrypts a replacement-token response payload using AES-256-GCM.
 * Uses a fresh 12-byte IV for every invocation and stores the GCM auth tag.
 * Key is derived from TOKEN_RESPONSE_ENCRYPTION_KEY, never from JWT secrets.
 */
export function encryptReplacementPayload(
  payload: IReplacementPayload,
  keyVersion?: string
): IEncryptedPayload {
  const version = keyVersion || authConfig.currentKeyVersion;
  const key = authConfig.getEncryptionKey(version);
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
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
export function decryptReplacementPayload(encrypted: IEncryptedPayload): IReplacementPayload {
  if (!encrypted || !encrypted.ciphertext || !encrypted.iv || !encrypted.authTag || !encrypted.keyVersion) {
    throw ApiError.unauthorized("Invalid encrypted payload structure.");
  }

  // Validate that iv, authTag, and ciphertext are valid lowercase hex strings before Buffer.from()
  const HEX_RE = /^[0-9a-fA-F]+$/;
  if (!HEX_RE.test(encrypted.iv)) {
    throw ApiError.unauthorized("Invalid initialization vector encoding.");
  }
  if (!HEX_RE.test(encrypted.authTag)) {
    throw ApiError.unauthorized("Invalid authentication tag encoding.");
  }
  if (!HEX_RE.test(encrypted.ciphertext)) {
    throw ApiError.unauthorized("Invalid ciphertext encoding.");
  }

  try {
    const key = authConfig.getEncryptionKey(encrypted.keyVersion);
    const iv = Buffer.from(encrypted.iv, "hex");
    const authTag = Buffer.from(encrypted.authTag, "hex");

    if (iv.length !== 12) {
      throw ApiError.unauthorized("Invalid initialization vector length.");
    }

    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encrypted.ciphertext, "hex")),
      decipher.final(),
    ]).toString("utf8");

    // Validate decrypted JSON structure before returning
    let parsed: unknown;
    try {
      parsed = JSON.parse(decrypted);
    } catch {
      throw ApiError.unauthorized("Decrypted payload is not valid JSON.");
    }

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof (parsed as Record<string, unknown>).accessToken !== "string" ||
      typeof (parsed as Record<string, unknown>).refreshToken !== "string" ||
      !(parsed as Record<string, unknown>).accessToken ||
      !(parsed as Record<string, unknown>).refreshToken
    ) {
      throw ApiError.unauthorized("Decrypted payload has invalid structure.");
    }

    return parsed as IReplacementPayload;
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw ApiError.unauthorized("Failed to decrypt replacement token payload: data corrupted or key invalid.");
  }
}
