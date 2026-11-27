import { IUserDocument, IUserResponse } from "../types/user.types.js";
import { IRegisterInput, ILoginInput } from "../validations/auth.validation.js";
export interface IRequestMetadata {
    ipAddress: string;
    userAgent?: string;
}
export interface IAuthTokensResult {
    accessToken: string;
    refreshToken: string;
}
export interface IAuthSessionResult extends IAuthTokensResult {
    user: IUserResponse;
}
/**
 * Parses duration strings like "15m", "7d", "24h", "60s" into milliseconds.
 */
export declare function parseDurationToMs(duration: string): number;
/**
 * Maps a Mongoose User document to a safe public IUserResponse (without password).
 */
export declare function toUserResponse(user: IUserDocument): IUserResponse;
/**
 * Registers a new user. Always assigns UserRole.REGULAR regardless of client input.
 * Issues an initial access + refresh token pair and persists the hashed refresh token.
 */
export declare function registerUser(input: IRegisterInput, meta: IRequestMetadata): Promise<IAuthSessionResult>;
/**
 * Authenticates a user with email & password, enforcing atomic failed-login tracking.
 * Resets ONLY the IP+email counter on success (preserves IP-wide counter).
 */
export declare function loginUser(input: ILoginInput, meta: IRequestMetadata): Promise<IAuthSessionResult>;
/**
 * Rotates a refresh token inside a MongoDB ACID transaction.
 * - Validates JWT signature, expiration, jti, userId, familyId, and SHA-256 tokenHash.
 * - Supports a 15-second encrypted grace window for legitimate concurrent client retries.
 * - Revokes the entire session family if reuse is detected outside the grace window.
 */
export declare function refreshSessionTokens(rawRefreshToken: string, meta: IRequestMetadata): Promise<IAuthTokensResult>;
/**
 * Revokes a single session family, invalidating both its refresh tokens and access tokens immediately.
 */
export declare function logoutSession(userId: string, familyId?: string, rawRefreshToken?: string): Promise<void>;
/**
 * Globally revokes all active sessions and access tokens for a user across all devices.
 * Atomically increments User.tokenVersion and marks all RefreshTokens as isRevoked: true.
 */
export declare function logoutAllDevices(userId: string): Promise<void>;
/**
 * Loads the live sanitized profile for the authenticated user (GET /me).
 */
export declare function getCurrentUser(userId: string): Promise<IUserResponse>;
//# sourceMappingURL=auth.service.d.ts.map