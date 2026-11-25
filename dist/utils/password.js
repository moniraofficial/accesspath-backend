"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.comparePassword = comparePassword;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const auth_js_1 = require("../config/auth.js");
const apiError_js_1 = require("./apiError.js");
/**
 * Hashes a plaintext password using bcrypt with configured salt rounds.
 * Never logs or reveals the password or resulting hash.
 */
async function hashPassword(password) {
    if (!password || typeof password !== "string") {
        throw apiError_js_1.ApiError.badRequest("Password must be a non-empty string.");
    }
    try {
        const salt = await bcryptjs_1.default.genSalt(auth_js_1.authConfig.bcryptSaltRounds);
        return await bcryptjs_1.default.hash(password, salt);
    }
    catch (error) {
        throw apiError_js_1.ApiError.internal("Failed to hash password safely.");
    }
}
/**
 * Securely compares a plaintext password with a bcrypt hash in constant-time.
 * Returns boolean; handles errors safely without throwing.
 */
async function comparePassword(password, hashedPassword) {
    if (!password || !hashedPassword || typeof password !== "string" || typeof hashedPassword !== "string") {
        return false;
    }
    try {
        return await bcryptjs_1.default.compare(password, hashedPassword);
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=password.js.map