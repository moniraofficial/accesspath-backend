import { UserRoleType } from "../config/roles.js";
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
export declare function generateTokenId(): string;
/**
 * Computes a SHA-256 hex digest of a token string.
 * Used for storing token hashes in MongoDB without persisting raw tokens.
 */
export declare function hashToken(token: string): string;
/**
 * Signs a short-lived access token (15m) with dedicated JWT_SECRET.
 * Explicitly binds tokenType: "access" and session familyId.
 */
export declare function generateAccessToken(payload: IAccessTokenSignPayload): string;
/**
 * Signs a long-lived refresh token (7d) with dedicated JWT_REFRESH_SECRET.
 * Explicitly binds tokenType: "refresh", jti, and familyId.
 */
export declare function generateRefreshToken(payload: IRefreshTokenSignPayload): string;
/**
 * Verifies an access token's signature, expiration, and claims.
 * Enforces tokenType: "access".
 */
export declare function verifyAccessToken(token: string): IAccessTokenClaims;
/**
 * Verifies a refresh token's signature, expiration, and claims.
 * Enforces tokenType: "refresh".
 */
export declare function verifyRefreshToken(token: string): IRefreshTokenClaims;
/**
 * Encrypts a replacement-token response payload using AES-256-GCM.
 * Uses a fresh 12-byte IV for every invocation and stores the GCM auth tag.
 * Key is derived from TOKEN_RESPONSE_ENCRYPTION_KEY, never from JWT secrets.
 */
export declare function encryptReplacementPayload(payload: IReplacementPayload, keyVersion?: string): IEncryptedPayload;
/**
 * Decrypts an AES-256-GCM replacement-token payload.
 * Verifies the GCM auth tag; handles wrong keys, tampered data, or malformed IVs safely.
 */
export declare function decryptReplacementPayload(encrypted: IEncryptedPayload): IReplacementPayload;
//# sourceMappingURL=jwt.d.ts.map