"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
exports.createAuthenticateMiddleware = createAuthenticateMiddleware;
const mongoose_1 = __importDefault(require("mongoose"));
const user_model_js_1 = require("../models/user.model.js");
const refresh_token_model_js_1 = require("../models/refresh-token.model.js");
const jwt_js_1 = require("../utils/jwt.js");
const apiError_js_1 = require("../utils/apiError.js");
const defaultDeps = {
    verifyToken: jwt_js_1.verifyAccessToken,
    findUserById: async (userId) => {
        if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
            return null;
        }
        const user = await user_model_js_1.User.findById(userId)
            .select("_id email role isActive tokenVersion")
            .lean();
        return user;
    },
    hasActiveSessionFamily: async (userId, familyId) => {
        if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
            return false;
        }
        const [hasRevokedToken, hasActiveToken] = await Promise.all([
            refresh_token_model_js_1.RefreshToken.exists({
                userId,
                familyId,
                isRevoked: true,
            }),
            refresh_token_model_js_1.RefreshToken.exists({
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
function extractBearerToken(authorizationHeader) {
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
function createAuthenticateMiddleware(deps = defaultDeps) {
    return async (req, _res, next) => {
        try {
            const token = extractBearerToken(req.headers.authorization);
            if (!token) {
                return next(apiError_js_1.ApiError.unauthorized("Authentication token required."));
            }
            const claims = deps.verifyToken(token);
            if (typeof claims.userId !== "string" ||
                !claims.userId.trim() ||
                typeof claims.familyId !== "string" ||
                !claims.familyId.trim() ||
                !Number.isInteger(claims.tokenVersion) ||
                claims.tokenVersion < 0) {
                return next(apiError_js_1.ApiError.unauthorized("Invalid access token claims."));
            }
            const user = await deps.findUserById(claims.userId);
            if (!user) {
                return next(apiError_js_1.ApiError.unauthorized("User account no longer exists."));
            }
            if (!user.isActive) {
                return next(apiError_js_1.ApiError.unauthorized("User account is inactive."));
            }
            if (typeof user.tokenVersion !== "number" || user.tokenVersion !== claims.tokenVersion) {
                return next(apiError_js_1.ApiError.unauthorized("Token has been revoked. Please log in again."));
            }
            const sessionActive = await deps.hasActiveSessionFamily(user._id.toString(), claims.familyId);
            if (!sessionActive) {
                return next(apiError_js_1.ApiError.unauthorized("Session has been revoked. Please log in again."));
            }
            req.user = {
                id: user._id.toString(),
                email: user.email,
                role: user.role,
                tokenVersion: user.tokenVersion,
                familyId: claims.familyId,
            };
            return next();
        }
        catch (error) {
            if (error instanceof apiError_js_1.ApiError) {
                return next(error);
            }
            return next(apiError_js_1.ApiError.unauthorized("Authentication failed."));
        }
    };
}
/**
 * Production Express authentication middleware using MongoDB User and RefreshToken models.
 */
exports.authenticate = createAuthenticateMiddleware();
//# sourceMappingURL=auth.middleware.js.map