import crypto from "node:crypto";
import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { RefreshToken } from "../models/refresh-token.model.js";
import { UserRole } from "../config/roles.js";
import { authConfig } from "../config/auth.js";
import { IUserDocument, IUserResponse } from "../types/user.types.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  encryptReplacementPayload,
  decryptReplacementPayload,
  hashToken,
  generateTokenId,
} from "../utils/jwt.js";
import { ApiError } from "../utils/apiError.js";
import { IRegisterInput, ILoginInput } from "../validations/auth.validation.js";
import {
  isLoginBlocked,
  recordFailedLogin,
  resetIpEmailFailedLogin,
} from "./rate-limit.service.js";

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

const DEFAULT_REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Parses duration strings like "15m", "7d", "24h", "60s" into milliseconds.
 */
export function parseDurationToMs(duration: string): number {
  const trimmed = duration.trim();
  const match = /^(\d+)\s*(s|m|h|d)$/i.exec(trimmed);
  if (!match) {
    const numeric = Number(trimmed);
    return Number.isFinite(numeric) && numeric > 0 ? numeric * 1000 : DEFAULT_REFRESH_TTL_MS;
  }

  const value = Number(match[1]);
  const unit = (match[2] || "d").toLowerCase();
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return value * (multipliers[unit] ?? DEFAULT_REFRESH_TTL_MS);
}

/**
 * Maps a Mongoose User document to a safe public IUserResponse (without password).
 */
export function toUserResponse(user: IUserDocument): IUserResponse {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    tokenVersion: user.tokenVersion,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

/**
 * Constant-time comparison of two SHA-256 hex digests.
 */
function hashesMatch(expectedHex: string, actualHex: string): boolean {
  const expectedBuf = Buffer.from(expectedHex, "hex");
  const actualBuf = Buffer.from(actualHex, "hex");
  if (expectedBuf.length !== actualBuf.length || expectedBuf.length === 0) {
    return false;
  }
  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}

/**
 * Registers a new user. Always assigns UserRole.REGULAR regardless of client input.
 * Issues an initial access + refresh token pair and persists the hashed refresh token.
 */
export async function registerUser(
  input: IRegisterInput,
  meta: IRequestMetadata
): Promise<IAuthSessionResult> {
  const existingUser = await User.findOne({ email: input.email }).select("_id").lean();
  if (existingUser) {
    throw ApiError.conflict("An account with this email already exists.");
  }

  const passwordHash = await hashPassword(input.password);

  let createdUser: IUserDocument;
  try {
    createdUser = await User.create({
      name: input.name,
      email: input.email,
      password: passwordHash,
      role: UserRole.REGULAR,
      isActive: true,
      tokenVersion: 0,
    });
  } catch (error: unknown) {
    if (error && typeof error === "object" && (error as { code?: number }).code === 11000) {
      throw ApiError.conflict("An account with this email already exists.");
    }
    throw error;
  }

  const familyId = generateTokenId();
  const jti = generateTokenId();

  const accessToken = generateAccessToken({
    userId: createdUser._id.toString(),
    email: createdUser.email,
    role: createdUser.role,
    tokenVersion: createdUser.tokenVersion,
    familyId,
  });

  const refreshToken = generateRefreshToken({
    userId: createdUser._id.toString(),
    familyId,
    jti,
  });

  const expiresAt = new Date(Date.now() + parseDurationToMs(authConfig.refreshExpiresIn));

  await RefreshToken.create({
    userId: createdUser._id,
    jti,
    familyId,
    tokenHash: hashToken(refreshToken),
    isUsed: false,
    isRevoked: false,
    expiresAt,
    ipAddress: meta.ipAddress,
    ...(meta.userAgent ? { userAgent: meta.userAgent } : {}),
  });

  return {
    user: toUserResponse(createdUser),
    accessToken,
    refreshToken,
  };
}

/**
 * Authenticates a user with email & password, enforcing atomic failed-login tracking.
 * Resets ONLY the IP+email counter on success (preserves IP-wide counter).
 */
export async function loginUser(
  input: ILoginInput,
  meta: IRequestMetadata
): Promise<IAuthSessionResult> {
  const blocked = await isLoginBlocked(meta.ipAddress, input.email);
  if (blocked) {
    throw new ApiError(429, "Too many failed login attempts. Please try again later.");
  }

  const user = await User.findOne({ email: input.email }).select("+password");

  if (!user || !user.password) {
    await recordFailedLogin(meta.ipAddress, input.email);
    throw ApiError.unauthorized("Invalid email or password.");
  }

  const isPasswordValid = await comparePassword(input.password, user.password);
  if (!isPasswordValid) {
    await recordFailedLogin(meta.ipAddress, input.email);
    throw ApiError.unauthorized("Invalid email or password.");
  }

  if (!user.isActive) {
    throw ApiError.unauthorized("User account is inactive.");
  }

  // Reset only IP+email counter; IP-wide counter remains intact
  await resetIpEmailFailedLogin(meta.ipAddress, input.email);

  const familyId = generateTokenId();
  const jti = generateTokenId();

  const accessToken = generateAccessToken({
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
    tokenVersion: user.tokenVersion,
    familyId,
  });

  const refreshToken = generateRefreshToken({
    userId: user._id.toString(),
    familyId,
    jti,
  });

  const expiresAt = new Date(Date.now() + parseDurationToMs(authConfig.refreshExpiresIn));

  await RefreshToken.create({
    userId: user._id,
    jti,
    familyId,
    tokenHash: hashToken(refreshToken),
    isUsed: false,
    isRevoked: false,
    expiresAt,
    ipAddress: meta.ipAddress,
    ...(meta.userAgent ? { userAgent: meta.userAgent } : {}),
  });

  return {
    user: toUserResponse(user),
    accessToken,
    refreshToken,
  };
}

type TxRotationOutcome =
  | { status: "rotated"; tokens: IAuthTokensResult }
  | { status: "grace_hit"; tokens: IAuthTokensResult }
  | { status: "revoked_replay" }
  | { status: "revoked_inactive_user" };

/**
 * Rotates a refresh token inside a MongoDB ACID transaction.
 * - Validates JWT signature, expiration, jti, userId, familyId, and SHA-256 tokenHash.
 * - Supports a 15-second encrypted grace window for legitimate concurrent client retries.
 * - Revokes the entire session family if reuse is detected outside the grace window.
 */
export async function refreshSessionTokens(
  rawRefreshToken: string,
  meta: IRequestMetadata
): Promise<IAuthTokensResult> {
  const claims = verifyRefreshToken(rawRefreshToken);
  if (!mongoose.Types.ObjectId.isValid(claims.userId)) {
    throw ApiError.unauthorized("Invalid refresh token.");
  }

  const incomingHash = hashToken(rawRefreshToken);
  const session = await mongoose.startSession();

  try {
    let outcome: TxRotationOutcome | undefined;

    await session.withTransaction(async () => {
      const tokenRecord = await RefreshToken.findOne({ jti: claims.jti })
        .select("+tokenHash +replacementPayload +encryptionIv +encryptionTag")
        .session(session);

      if (!tokenRecord) {
        throw ApiError.unauthorized("Invalid refresh token.");
      }

      if (
        tokenRecord.userId.toString() !== claims.userId ||
        tokenRecord.familyId !== claims.familyId ||
        !hashesMatch(tokenRecord.tokenHash, incomingHash)
      ) {
        throw ApiError.unauthorized("Invalid refresh token.");
      }

      if (tokenRecord.expiresAt.getTime() <= Date.now()) {
        throw ApiError.unauthorized("Refresh token has expired.");
      }

      if (tokenRecord.isRevoked) {
        throw ApiError.unauthorized("Refresh token has been revoked.");
      }

      // Already rotated: check 15s grace window vs replay attack
      if (tokenRecord.isUsed) {
        const withinGraceWindow =
          Boolean(tokenRecord.rotatedAt) &&
          Date.now() - (tokenRecord.rotatedAt as Date).getTime() <= authConfig.graceWindowMs &&
          Boolean(tokenRecord.replacementPayload) &&
          Boolean(tokenRecord.encryptionIv) &&
          Boolean(tokenRecord.encryptionTag) &&
          Boolean(tokenRecord.encryptionKeyVersion);

        if (withinGraceWindow) {
          const decrypted = decryptReplacementPayload({
            ciphertext: tokenRecord.replacementPayload as string,
            iv: tokenRecord.encryptionIv as string,
            authTag: tokenRecord.encryptionTag as string,
            keyVersion: tokenRecord.encryptionKeyVersion as string,
          });
          outcome = { status: "grace_hit", tokens: decrypted };
          return;
        }

        // Reuse outside grace window: revoke entire session family and commit
        await RefreshToken.updateMany(
          { userId: tokenRecord.userId, familyId: tokenRecord.familyId },
          { $set: { isRevoked: true } },
          { session }
        );
        outcome = { status: "revoked_replay" };
        return;
      }

      // Normal rotation: verify live user is still active
      const user = await User.findById(claims.userId).session(session);
      if (!user || !user.isActive) {
        await RefreshToken.updateMany(
          { userId: tokenRecord.userId, familyId: tokenRecord.familyId },
          { $set: { isRevoked: true } },
          { session }
        );
        outcome = { status: "revoked_inactive_user" };
        return;
      }

      const newJti = generateTokenId();
      const newAccessToken = generateAccessToken({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        tokenVersion: user.tokenVersion,
        familyId: claims.familyId,
      });
      const newRefreshToken = generateRefreshToken({
        userId: user._id.toString(),
        familyId: claims.familyId,
        jti: newJti,
      });

      const encrypted = encryptReplacementPayload({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });

      const now = new Date();
      const markUsedResult = await RefreshToken.updateOne(
        {
          _id: tokenRecord._id,
          isUsed: false,
          isRevoked: false,
        },
        {
          $set: {
            isUsed: true,
            rotatedAt: now,
            replacementPayload: encrypted.ciphertext,
            encryptionIv: encrypted.iv,
            encryptionTag: encrypted.authTag,
            encryptionKeyVersion: encrypted.keyVersion,
            replacementExpiresAt: tokenRecord.expiresAt,
          },
        },
        { session }
      );

      if (markUsedResult.modifiedCount !== 1) {
        throw ApiError.unauthorized("Refresh token rotation conflict. Please retry.");
      }

      const newExpiresAt = new Date(
        Date.now() + parseDurationToMs(authConfig.refreshExpiresIn)
      );

      await RefreshToken.create(
        [
          {
            userId: user._id,
            jti: newJti,
            familyId: claims.familyId,
            tokenHash: hashToken(newRefreshToken),
            isUsed: false,
            isRevoked: false,
            expiresAt: newExpiresAt,
            ipAddress: meta.ipAddress,
            ...(meta.userAgent ? { userAgent: meta.userAgent } : {}),
          },
        ],
        { session }
      );

      outcome = {
        status: "rotated",
        tokens: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        },
      };
    });

    if (!outcome) {
      throw ApiError.internal("Refresh token transaction did not produce an outcome.");
    }

    if (outcome.status === "revoked_replay") {
      throw ApiError.unauthorized("Refresh token reuse detected. Session revoked.");
    }

    if (outcome.status === "revoked_inactive_user") {
      throw ApiError.unauthorized("User account is inactive or no longer exists.");
    }

    return outcome.tokens;
  } finally {
    await session.endSession();
  }
}

/**
 * Revokes a single session family, invalidating both its refresh tokens and access tokens immediately.
 */
export async function logoutSession(
  userId: string,
  familyId?: string,
  rawRefreshToken?: string
): Promise<void> {
  const familyIdsToRevoke = new Set<string>();

  if (familyId) {
    familyIdsToRevoke.add(familyId);
  }

  if (rawRefreshToken) {
    try {
      const claims = verifyRefreshToken(rawRefreshToken);
      if (claims.userId === userId && claims.familyId) {
        familyIdsToRevoke.add(claims.familyId);
      }
    } catch {
      // Ignore expired/invalid refresh token in logout body; current session family still revokes
    }
  }

  if (familyIdsToRevoke.size === 0) {
    return;
  }

  await RefreshToken.updateMany(
    {
      userId,
      familyId: { $in: Array.from(familyIdsToRevoke) },
      isRevoked: false,
    },
    { $set: { isRevoked: true } }
  );
}

/**
 * Globally revokes all active sessions and access tokens for a user across all devices.
 * Atomically increments User.tokenVersion and marks all RefreshTokens as isRevoked: true.
 */
export async function logoutAllDevices(userId: string): Promise<void> {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $inc: { tokenVersion: 1 } },
        { returnDocument: "after", session }
      );

      if (!updatedUser) {
        throw ApiError.notFound("User account not found.");
      }

      await RefreshToken.updateMany(
        { userId, isRevoked: false },
        { $set: { isRevoked: true } },
        { session }
      );
    });
  } finally {
    await session.endSession();
  }
}

/**
 * Loads the live sanitized profile for the authenticated user (GET /me).
 */
export async function getCurrentUser(userId: string): Promise<IUserResponse> {
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound("User account not found.");
  }
  return toUserResponse(user);
}
