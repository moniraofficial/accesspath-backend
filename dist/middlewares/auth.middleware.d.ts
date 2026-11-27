import type { Request, Response, NextFunction } from "express";
import { IAccessTokenClaims } from "../utils/jwt.js";
import { UserRoleType } from "../config/roles.js";
export interface IAuthUserRecord {
    _id: {
        toString(): string;
    };
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
/**
 * Creates an authentication middleware with injectable dependencies for testability.
 * 1. Verifies JWT access token signature, expiration, and claims.
 * 2. Loads the live user record from MongoDB.
 * 3. Rejects inactive users and mismatched tokenVersion (global revocation).
 * 4. Verifies the token's session familyId is still active (single-session revocation).
 * 5. Attaches live user identity to req.user.
 */
export declare function createAuthenticateMiddleware(deps?: IAuthMiddlewareDeps): (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Production Express authentication middleware using MongoDB User and RefreshToken models.
 */
export declare const authenticate: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=auth.middleware.d.ts.map