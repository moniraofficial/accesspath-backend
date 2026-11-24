"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authConfig = void 0;
require("./env.js");
const isProduction = process.env.NODE_ENV === "production";
/**
 * Safely resolves a required string secret from the environment.
 * In production mode, throws a fatal error if the secret is missing or less than 32 characters.
 * In development mode, falls back to a non-production development string.
 * Secret values are never exposed or interpolated in error logs.
 */
function getRequiredSecret(key, devFallback) {
    const secret = process.env[key];
    if (!secret) {
        if (isProduction) {
            throw new Error(`[SECURITY FATAL] Required environment variable "${key}" is missing in production.`);
        }
        return devFallback;
    }
    if (isProduction && secret.length < 32) {
        throw new Error(`[SECURITY FATAL] Environment variable "${key}" must be at least 32 characters in production.`);
    }
    return secret;
}
/**
 * Resolves a versioned symmetric encryption key Buffer (at least 32 bytes for AES-256-GCM).
 * Supports key rotation across versions (e.g. "v1", "v2").
 */
function resolveEncryptionKey(version) {
    const activeVersion = version || process.env.CURRENT_ENCRYPTION_KEY_VERSION || "v1";
    const envVarName = activeVersion === "v1"
        ? "TOKEN_RESPONSE_ENCRYPTION_KEY"
        : `TOKEN_RESPONSE_ENCRYPTION_KEY_${activeVersion.toUpperCase()}`;
    const rawKey = process.env[envVarName] || process.env.TOKEN_RESPONSE_ENCRYPTION_KEY;
    if (!rawKey) {
        if (isProduction) {
            throw new Error(`[SECURITY FATAL] Required encryption key "${envVarName}" is missing in production.`);
        }
        // 32-byte deterministic fallback for development only
        return Buffer.from("0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef", "hex");
    }
    // Convert hex or utf-8 string to binary buffer
    let keyBuffer;
    if (/^[0-9a-fA-F]{64}$/.test(rawKey)) {
        keyBuffer = Buffer.from(rawKey, "hex");
    }
    else {
        keyBuffer = Buffer.from(rawKey, "utf-8");
    }
    if (keyBuffer.length < 32) {
        if (isProduction) {
            throw new Error(`[SECURITY FATAL] Encryption key "${envVarName}" must be at least 32 bytes (256 bits) in production.`);
        }
    }
    return keyBuffer.subarray(0, 32);
}
/**
 * Centralized Authentication Configuration with Lazy Getters.
 * Properties are resolved dynamically at access time to prevent ES module hoisting races.
 */
exports.authConfig = {
    get jwtSecret() {
        return getRequiredSecret("JWT_SECRET", "dev_accesspath_jwt_secret_do_not_use_in_production_32b");
    },
    get refreshSecret() {
        return getRequiredSecret("JWT_REFRESH_SECRET", "dev_accesspath_refresh_secret_do_not_use_in_prod_32b");
    },
    get accessExpiresIn() {
        return process.env.JWT_EXPIRES_IN || "15m";
    },
    get refreshExpiresIn() {
        return process.env.JWT_REFRESH_EXPIRES_IN || "7d";
    },
    get currentKeyVersion() {
        return process.env.CURRENT_ENCRYPTION_KEY_VERSION || "v1";
    },
    getEncryptionKey(version) {
        return resolveEncryptionKey(version);
    },
    bcryptSaltRounds: 10,
    graceWindowMs: 15 * 1000, // 15 seconds grace window for concurrent client retries
};
//# sourceMappingURL=auth.js.map