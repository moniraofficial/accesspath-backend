"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRegistrationInput = validateRegistrationInput;
exports.validateLoginInput = validateLoginInput;
exports.validateRefreshTokenInput = validateRefreshTokenInput;
exports.validateLogoutInput = validateLogoutInput;
const roles_js_1 = require("../config/roles.js");
const apiError_js_1 = require("../utils/apiError.js");
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[a-zA-Z])(?=.*\d)/;
/**
 * Validates and sanitizes user registration input.
 * Strictly enforces minimum 8 characters, letter + number, valid email, and rejects privileged role assignments.
 */
function validateRegistrationInput(data) {
    if (!data || typeof data !== "object") {
        throw apiError_js_1.ApiError.badRequest("Invalid request body: expected JSON object.");
    }
    const body = data;
    // Security Check: Public users cannot assign themselves privileged roles.
    // We explicitly check for the presence of the key and that it is not undefined/null
    // before the string comparison, so a non-string value is also rejected.
    if ("role" in body && body.role !== undefined && body.role !== null && body.role !== roles_js_1.UserRole.REGULAR) {
        throw apiError_js_1.ApiError.badRequest("Assigning roles during public registration is not permitted.");
    }
    const rawName = body.name;
    const rawEmail = body.email;
    const rawPassword = body.password;
    // Name validation
    if (!rawName || typeof rawName !== "string") {
        throw apiError_js_1.ApiError.badRequest("Name is required and must be a string.");
    }
    const trimmedName = rawName.trim();
    if (trimmedName.length < 2 || trimmedName.length > 100) {
        throw apiError_js_1.ApiError.badRequest("Name must be between 2 and 100 characters.");
    }
    // Email validation & normalization
    if (!rawEmail || typeof rawEmail !== "string") {
        throw apiError_js_1.ApiError.badRequest("Email is required and must be a string.");
    }
    const normalizedEmail = rawEmail.trim().toLowerCase();
    if (!EMAIL_REGEX.test(normalizedEmail)) {
        throw apiError_js_1.ApiError.badRequest("Please provide a valid email address.");
    }
    // Password validation (min 8 chars, letter + number)
    if (!rawPassword || typeof rawPassword !== "string") {
        throw apiError_js_1.ApiError.badRequest("Password is required and must be a string.");
    }
    if (rawPassword.length < 8) {
        throw apiError_js_1.ApiError.badRequest("Password must be at least 8 characters long.");
    }
    if (!PASSWORD_REGEX.test(rawPassword)) {
        throw apiError_js_1.ApiError.badRequest("Password must contain at least one letter and one number.");
    }
    return {
        name: trimmedName,
        email: normalizedEmail,
        password: rawPassword,
    };
}
/**
 * Validates and sanitizes user login input.
 */
function validateLoginInput(data) {
    if (!data || typeof data !== "object") {
        throw apiError_js_1.ApiError.badRequest("Invalid request body: expected JSON object.");
    }
    const body = data;
    const rawEmail = body.email;
    const rawPassword = body.password;
    if (!rawEmail || typeof rawEmail !== "string") {
        throw apiError_js_1.ApiError.badRequest("Email is required.");
    }
    const normalizedEmail = rawEmail.trim().toLowerCase();
    if (!EMAIL_REGEX.test(normalizedEmail)) {
        throw apiError_js_1.ApiError.badRequest("Please provide a valid email address.");
    }
    if (!rawPassword || typeof rawPassword !== "string" || !rawPassword.length) {
        throw apiError_js_1.ApiError.badRequest("Password is required.");
    }
    return {
        email: normalizedEmail,
        password: rawPassword,
    };
}
/**
 * Validates refresh token request body.
 */
function validateRefreshTokenInput(data) {
    if (!data || typeof data !== "object") {
        throw apiError_js_1.ApiError.badRequest("Invalid request body: expected JSON object.");
    }
    const body = data;
    const rawRefreshToken = body.refreshToken;
    if (!rawRefreshToken || typeof rawRefreshToken !== "string" || !rawRefreshToken.trim().length) {
        throw apiError_js_1.ApiError.badRequest("Refresh token is required.");
    }
    return {
        refreshToken: rawRefreshToken.trim(),
    };
}
/**
 * Validates logout request body.
 */
function validateLogoutInput(data) {
    if (!data || typeof data !== "object") {
        return {};
    }
    const body = data;
    const rawRefreshToken = body.refreshToken;
    if (rawRefreshToken && typeof rawRefreshToken === "string") {
        return { refreshToken: rawRefreshToken.trim() };
    }
    return {};
}
//# sourceMappingURL=auth.validation.js.map