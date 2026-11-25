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
    // Security Check: Public users cannot assign themselves privileged roles
    if ("role" in body && body.role !== roles_js_1.UserRole.REGULAR) {
        throw apiError_js_1.ApiError.badRequest("Assigning roles during public registration is not permitted.");
    }
    const { name, email, password } = body;
    // Name validation
    if (!name || typeof name !== "string") {
        throw apiError_js_1.ApiError.badRequest("Name is required and must be a string.");
    }
    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 100) {
        throw apiError_js_1.ApiError.badRequest("Name must be between 2 and 100 characters.");
    }
    // Email validation & normalization
    if (!email || typeof email !== "string") {
        throw apiError_js_1.ApiError.badRequest("Email is required and must be a string.");
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(normalizedEmail)) {
        throw apiError_js_1.ApiError.badRequest("Please provide a valid email address.");
    }
    // Password validation (min 8 chars, letter + number)
    if (!password || typeof password !== "string") {
        throw apiError_js_1.ApiError.badRequest("Password is required and must be a string.");
    }
    if (password.length < 8) {
        throw apiError_js_1.ApiError.badRequest("Password must be at least 8 characters long.");
    }
    if (!PASSWORD_REGEX.test(password)) {
        throw apiError_js_1.ApiError.badRequest("Password must contain at least one letter and one number.");
    }
    return {
        name: trimmedName,
        email: normalizedEmail,
        password,
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
    const { email, password } = body;
    if (!email || typeof email !== "string") {
        throw apiError_js_1.ApiError.badRequest("Email is required.");
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(normalizedEmail)) {
        throw apiError_js_1.ApiError.badRequest("Please provide a valid email address.");
    }
    if (!password || typeof password !== "string" || !password.length) {
        throw apiError_js_1.ApiError.badRequest("Password is required.");
    }
    return {
        email: normalizedEmail,
        password,
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
    const { refreshToken } = body;
    if (!refreshToken || typeof refreshToken !== "string" || !refreshToken.trim().length) {
        throw apiError_js_1.ApiError.badRequest("Refresh token is required.");
    }
    return {
        refreshToken: refreshToken.trim(),
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
    const { refreshToken } = body;
    if (refreshToken && typeof refreshToken === "string") {
        return { refreshToken: refreshToken.trim() };
    }
    return {};
}
//# sourceMappingURL=auth.validation.js.map