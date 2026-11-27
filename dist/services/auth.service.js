"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseDurationToMs = parseDurationToMs;
exports.toUserResponse = toUserResponse;
exports.registerUser = registerUser;
exports.loginUser = loginUser;
exports.refreshSessionTokens = refreshSessionTokens;
exports.logoutSession = logoutSession;
exports.logoutAllDevices = logoutAllDevices;
exports.getCurrentUser = getCurrentUser;
const node_crypto_1 = __importDefault(require("node:crypto"));
const mongoose_1 = __importDefault(require("mongoose"));
const user_model_js_1 = require("../models/user.model.js");
const refresh_token_model_js_1 = require("../models/refresh-token.model.js");
const roles_js_1 = require("../config/roles.js");
const auth_js_1 = require("../config/auth.js");
const password_js_1 = require("../utils/password.js");
const jwt_js_1 = require("../utils/jwt.js");
const apiError_js_1 = require("../utils/apiError.js");
const rate_limit_service_js_1 = require("./rate-limit.service.js");
const DEFAULT_REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;
/**
 * Parses duration strings like "15m", "7d", "24h", "60s" into milliseconds.
 */
function parseDurationToMs(duration) {
    const trimmed = duration.trim();
    const match = /^(\d+)\s*(s|m|h|d)$/i.exec(trimmed);
    if (!match) {
        const numeric = Number(trimmed);
        return Number.isFinite(numeric) && numeric > 0 ? numeric * 1000 : DEFAULT_REFRESH_TTL_MS;
    }
    const value = Number(match[1]);
    const unit = (match[2] || "d").toLowerCase();
    const multipliers = {
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
function toUserResponse(user) {
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
function hashesMatch(expectedHex, actualHex) {
    const expectedBuf = Buffer.from(expectedHex, "hex");
    const actualBuf = Buffer.from(actualHex, "hex");
    if (expectedBuf.length !== actualBuf.length || expectedBuf.length === 0) {
        return false;
    }
    return node_crypto_1.default.timingSafeEqual(expectedBuf, actualBuf);
}
/**
 * Registers a new user. Always assigns UserRole.REGULAR regardless of client input.
 * Issues an initial access + refresh token pair and persists the hashed refresh token.
 */
async function registerUser(input, meta) {
    const existingUser = await user_model_js_1.User.findOne({ email: input.email }).select("_id").lean();
    if (existingUser) {
        throw apiError_js_1.ApiError.conflict("An account with this email already exists.");
    }
    const passwordHash = await (0, password_js_1.hashPassword)(input.password);
    let createdUser;
    try {
        createdUser = await user_model_js_1.User.create({
            name: input.name,
            email: input.email,
            password: passwordHash,
            role: roles_js_1.UserRole.REGULAR,
            isActive: true,
            tokenVersion: 0,
        });
    }
    catch (error) {
        if (error && typeof error === "object" && error.code === 11000) {
            throw apiError_js_1.ApiError.conflict("An account with this email already exists.");
        }
        throw error;
    }
    const familyId = (0, jwt_js_1.generateTokenId)();
    const jti = (0, jwt_js_1.generateTokenId)();
    const accessToken = (0, jwt_js_1.generateAccessToken)({
        userId: createdUser._id.toString(),
        email: createdUser.email,
        role: createdUser.role,
        tokenVersion: createdUser.tokenVersion,
        familyId,
    });
    const refreshToken = (0, jwt_js_1.generateRefreshToken)({
        userId: createdUser._id.toString(),
        familyId,
        jti,
    });
    const expiresAt = new Date(Date.now() + parseDurationToMs(auth_js_1.authConfig.refreshExpiresIn));
    await refresh_token_model_js_1.RefreshToken.create({
        userId: createdUser._id,
        jti,
        familyId,
        tokenHash: (0, jwt_js_1.hashToken)(refreshToken),
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
async function loginUser(input, meta) {
    const blocked = await (0, rate_limit_service_js_1.isLoginBlocked)(meta.ipAddress, input.email);
    if (blocked) {
        throw new apiError_js_1.ApiError(429, "Too many failed login attempts. Please try again later.");
    }
    const user = await user_model_js_1.User.findOne({ email: input.email }).select("+password");
    if (!user || !user.password) {
        await (0, rate_limit_service_js_1.recordFailedLogin)(meta.ipAddress, input.email);
        throw apiError_js_1.ApiError.unauthorized("Invalid email or password.");
    }
    const isPasswordValid = await (0, password_js_1.comparePassword)(input.password, user.password);
    if (!isPasswordValid) {
        await (0, rate_limit_service_js_1.recordFailedLogin)(meta.ipAddress, input.email);
        throw apiError_js_1.ApiError.unauthorized("Invalid email or password.");
    }
    if (!user.isActive) {
        throw apiError_js_1.ApiError.unauthorized("User account is inactive.");
    }
    // Reset only IP+email counter; IP-wide counter remains intact
    await (0, rate_limit_service_js_1.resetIpEmailFailedLogin)(meta.ipAddress, input.email);
    const familyId = (0, jwt_js_1.generateTokenId)();
    const jti = (0, jwt_js_1.generateTokenId)();
    const accessToken = (0, jwt_js_1.generateAccessToken)({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        tokenVersion: user.tokenVersion,
        familyId,
    });
    const refreshToken = (0, jwt_js_1.generateRefreshToken)({
        userId: user._id.toString(),
        familyId,
        jti,
    });
    const expiresAt = new Date(Date.now() + parseDurationToMs(auth_js_1.authConfig.refreshExpiresIn));
    await refresh_token_model_js_1.RefreshToken.create({
        userId: user._id,
        jti,
        familyId,
        tokenHash: (0, jwt_js_1.hashToken)(refreshToken),
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
/**
 * Rotates a refresh token inside a MongoDB ACID transaction.
 * - Validates JWT signature, expiration, jti, userId, familyId, and SHA-256 tokenHash.
 * - Supports a 15-second encrypted grace window for legitimate concurrent client retries.
 * - Revokes the entire session family if reuse is detected outside the grace window.
 */
async function refreshSessionTokens(rawRefreshToken, meta) {
    const claims = (0, jwt_js_1.verifyRefreshToken)(rawRefreshToken);
    if (!mongoose_1.default.Types.ObjectId.isValid(claims.userId)) {
        throw apiError_js_1.ApiError.unauthorized("Invalid refresh token.");
    }
    const incomingHash = (0, jwt_js_1.hashToken)(rawRefreshToken);
    const session = await mongoose_1.default.startSession();
    try {
        let outcome;
        await session.withTransaction(async () => {
            const tokenRecord = await refresh_token_model_js_1.RefreshToken.findOne({ jti: claims.jti })
                .select("+tokenHash +replacementPayload +encryptionIv +encryptionTag")
                .session(session);
            if (!tokenRecord) {
                throw apiError_js_1.ApiError.unauthorized("Invalid refresh token.");
            }
            if (tokenRecord.userId.toString() !== claims.userId ||
                tokenRecord.familyId !== claims.familyId ||
                !hashesMatch(tokenRecord.tokenHash, incomingHash)) {
                throw apiError_js_1.ApiError.unauthorized("Invalid refresh token.");
            }
            if (tokenRecord.expiresAt.getTime() <= Date.now()) {
                throw apiError_js_1.ApiError.unauthorized("Refresh token has expired.");
            }
            if (tokenRecord.isRevoked) {
                throw apiError_js_1.ApiError.unauthorized("Refresh token has been revoked.");
            }
            // Already rotated: check 15s grace window vs replay attack
            if (tokenRecord.isUsed) {
                const withinGraceWindow = Boolean(tokenRecord.rotatedAt) &&
                    Date.now() - tokenRecord.rotatedAt.getTime() <= auth_js_1.authConfig.graceWindowMs &&
                    Boolean(tokenRecord.replacementPayload) &&
                    Boolean(tokenRecord.encryptionIv) &&
                    Boolean(tokenRecord.encryptionTag) &&
                    Boolean(tokenRecord.encryptionKeyVersion);
                if (withinGraceWindow) {
                    const decrypted = (0, jwt_js_1.decryptReplacementPayload)({
                        ciphertext: tokenRecord.replacementPayload,
                        iv: tokenRecord.encryptionIv,
                        authTag: tokenRecord.encryptionTag,
                        keyVersion: tokenRecord.encryptionKeyVersion,
                    });
                    outcome = { status: "grace_hit", tokens: decrypted };
                    return;
                }
                // Reuse outside grace window: revoke entire session family and commit
                await refresh_token_model_js_1.RefreshToken.updateMany({ userId: tokenRecord.userId, familyId: tokenRecord.familyId }, { $set: { isRevoked: true } }, { session });
                outcome = { status: "revoked_replay" };
                return;
            }
            // Normal rotation: verify live user is still active
            const user = await user_model_js_1.User.findById(claims.userId).session(session);
            if (!user || !user.isActive) {
                await refresh_token_model_js_1.RefreshToken.updateMany({ userId: tokenRecord.userId, familyId: tokenRecord.familyId }, { $set: { isRevoked: true } }, { session });
                outcome = { status: "revoked_inactive_user" };
                return;
            }
            const newJti = (0, jwt_js_1.generateTokenId)();
            const newAccessToken = (0, jwt_js_1.generateAccessToken)({
                userId: user._id.toString(),
                email: user.email,
                role: user.role,
                tokenVersion: user.tokenVersion,
                familyId: claims.familyId,
            });
            const newRefreshToken = (0, jwt_js_1.generateRefreshToken)({
                userId: user._id.toString(),
                familyId: claims.familyId,
                jti: newJti,
            });
            const encrypted = (0, jwt_js_1.encryptReplacementPayload)({
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
            });
            const now = new Date();
            const markUsedResult = await refresh_token_model_js_1.RefreshToken.updateOne({
                _id: tokenRecord._id,
                isUsed: false,
                isRevoked: false,
            }, {
                $set: {
                    isUsed: true,
                    rotatedAt: now,
                    replacementPayload: encrypted.ciphertext,
                    encryptionIv: encrypted.iv,
                    encryptionTag: encrypted.authTag,
                    encryptionKeyVersion: encrypted.keyVersion,
                    replacementExpiresAt: tokenRecord.expiresAt,
                },
            }, { session });
            if (markUsedResult.modifiedCount !== 1) {
                throw apiError_js_1.ApiError.unauthorized("Refresh token rotation conflict. Please retry.");
            }
            const newExpiresAt = new Date(Date.now() + parseDurationToMs(auth_js_1.authConfig.refreshExpiresIn));
            await refresh_token_model_js_1.RefreshToken.create([
                {
                    userId: user._id,
                    jti: newJti,
                    familyId: claims.familyId,
                    tokenHash: (0, jwt_js_1.hashToken)(newRefreshToken),
                    isUsed: false,
                    isRevoked: false,
                    expiresAt: newExpiresAt,
                    ipAddress: meta.ipAddress,
                    ...(meta.userAgent ? { userAgent: meta.userAgent } : {}),
                },
            ], { session });
            outcome = {
                status: "rotated",
                tokens: {
                    accessToken: newAccessToken,
                    refreshToken: newRefreshToken,
                },
            };
        });
        if (!outcome) {
            throw apiError_js_1.ApiError.internal("Refresh token transaction did not produce an outcome.");
        }
        if (outcome.status === "revoked_replay") {
            throw apiError_js_1.ApiError.unauthorized("Refresh token reuse detected. Session revoked.");
        }
        if (outcome.status === "revoked_inactive_user") {
            throw apiError_js_1.ApiError.unauthorized("User account is inactive or no longer exists.");
        }
        return outcome.tokens;
    }
    finally {
        await session.endSession();
    }
}
/**
 * Revokes a single session family, invalidating both its refresh tokens and access tokens immediately.
 */
async function logoutSession(userId, familyId, rawRefreshToken) {
    const familyIdsToRevoke = new Set();
    if (familyId) {
        familyIdsToRevoke.add(familyId);
    }
    if (rawRefreshToken) {
        try {
            const claims = (0, jwt_js_1.verifyRefreshToken)(rawRefreshToken);
            if (claims.userId === userId && claims.familyId) {
                familyIdsToRevoke.add(claims.familyId);
            }
        }
        catch {
            // Ignore expired/invalid refresh token in logout body; current session family still revokes
        }
    }
    if (familyIdsToRevoke.size === 0) {
        return;
    }
    await refresh_token_model_js_1.RefreshToken.updateMany({
        userId,
        familyId: { $in: Array.from(familyIdsToRevoke) },
        isRevoked: false,
    }, { $set: { isRevoked: true } });
}
/**
 * Globally revokes all active sessions and access tokens for a user across all devices.
 * Atomically increments User.tokenVersion and marks all RefreshTokens as isRevoked: true.
 */
async function logoutAllDevices(userId) {
    const session = await mongoose_1.default.startSession();
    try {
        await session.withTransaction(async () => {
            const updatedUser = await user_model_js_1.User.findByIdAndUpdate(userId, { $inc: { tokenVersion: 1 } }, { returnDocument: "after", session });
            if (!updatedUser) {
                throw apiError_js_1.ApiError.notFound("User account not found.");
            }
            await refresh_token_model_js_1.RefreshToken.updateMany({ userId, isRevoked: false }, { $set: { isRevoked: true } }, { session });
        });
    }
    finally {
        await session.endSession();
    }
}
/**
 * Loads the live sanitized profile for the authenticated user (GET /me).
 */
async function getCurrentUser(userId) {
    const user = await user_model_js_1.User.findById(userId);
    if (!user) {
        throw apiError_js_1.ApiError.notFound("User account not found.");
    }
    return toUserResponse(user);
}
//# sourceMappingURL=auth.service.js.map