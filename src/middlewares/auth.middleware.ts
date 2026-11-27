import type { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { RefreshToken } from "../models/refresh-token.model.js";
import { verifyAccessToken, IAccessTokenClaims } from "../utils/jwt.js";
import { ApiError } from "../utils/apiError.js";
import { UserRoleType } from "../config/roles.js";

export interface IAuthUserRecord {
  _id: { toString(): string };
  email: string;
  role: UserRoleType;
  isActive: boolean;
  tokenVersion: number;
}

export interface IAuthMiddlewareDeps {
  verifyToken: (token: string) => IAccessTokenClaims;
  findUserById: (userId: string) => Promise<IAuthUserRecord | null>;
  hasActiveSessionFamily: (userId: string, familyId: string) => Promise<boolean>;
}

const defaultDeps: IAuthMiddlewareDeps = {
  verifyToken: verifyAccessToken,
  findUserById: async (userId: string) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return null;
    }
    const user = await User.findById(userId)
      .select("_id email role isActive tokenVersion")
      .lean();
    return user as IAuthUserRecord | null;
  },
  hasActiveSessionFamily: async (userId: string, familyId: string) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return false;
    }

    const [hasRevokedToken, hasActiveToken] = await Promise.all([
      RefreshToken.exists({
        userId,
        familyId,
        isRevoked: true,
      }),
      RefreshToken.exists({
        userId,
        familyId,
        isRevoked: false,
        isUsed: false,
        expiresAt: { $gt: new Date() },
      }),
    ]);

    return !hasRevokedToken && Boolean(hasActiveToken);
  },
};

/**
 * Extracts a Bearer token from the Authorization header.
 * Returns null if the header is missing or not in `Bearer <token>` format.
 */
function extractBearerToken(authorizationHeader: string | undefined): string | null {
  if (!authorizationHeader || typeof authorizationHeader !== "string") {
    return null;
  }

  const parts = authorizationHeader.trim().split(/\s+/);
  if (parts.length !== 2) {
    return null;
  }

  const [scheme, token] = parts;
  if (!scheme || scheme.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token;
}

/**
 * Creates an authentication middleware with injectable dependencies for testability.
 * 1. Verifies JWT access token signature, expiration, and claims.
 * 2. Loads the live user record from MongoDB.
 * 3. Rejects inactive users and mismatched tokenVersion (global revocation).
 * 4. Verifies the token's session familyId is still active (single-session revocation).
 * 5. Attaches live user identity to req.user.
 */
export function createAuthenticateMiddleware(
  deps: IAuthMiddlewareDeps = defaultDeps
): (req: Request, res: Response, next: NextFunction) => Promise<void> {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = extractBearerToken(req.headers.authorization);
      if (!token) {
        return next(ApiError.unauthorized("Authentication token required."));
      }

      const claims = deps.verifyToken(token);

      if (
        typeof claims.userId !== "string" ||
        !claims.userId.trim() ||
        typeof claims.familyId !== "string" ||
        !claims.familyId.trim() ||
        !Number.isInteger(claims.tokenVersion) ||
        claims.tokenVersion < 0
      ) {
        return next(ApiError.unauthorized("Invalid access token claims."));
      }

      const user = await deps.findUserById(claims.userId);
      if (!user) {
        return next(ApiError.unauthorized("User account no longer exists."));
      }

      if (!user.isActive) {
        return next(ApiError.unauthorized("User account is inactive."));
      }

      if (typeof user.tokenVersion !== "number" || user.tokenVersion !== claims.tokenVersion) {
        return next(ApiError.unauthorized("Token has been revoked. Please log in again."));
      }

      const sessionActive = await deps.hasActiveSessionFamily(
        user._id.toString(),
        claims.familyId
      );
      if (!sessionActive) {
        return next(ApiError.unauthorized("Session has been revoked. Please log in again."));
      }

      req.user = {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        tokenVersion: user.tokenVersion,
        familyId: claims.familyId,
      };

      return next();
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        return next(error);
      }
      return next(ApiError.unauthorized("Authentication failed."));
    }
  };
}

/**
 * Production Express authentication middleware using MongoDB User and RefreshToken models.
 */
export const authenticate = createAuthenticateMiddleware();
