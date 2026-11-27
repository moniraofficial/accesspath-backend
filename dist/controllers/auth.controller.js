"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.refresh = refresh;
exports.logout = logout;
exports.logoutAll = logoutAll;
exports.getMe = getMe;
const auth_validation_js_1 = require("../validations/auth.validation.js");
const auth_service_js_1 = require("../services/auth.service.js");
const rate_limit_middleware_js_1 = require("../middlewares/rate-limit.middleware.js");
const apiResponse_js_1 = require("../utils/apiResponse.js");
const apiError_js_1 = require("../utils/apiError.js");
function extractRequestMeta(req) {
    const userAgent = req.get("user-agent");
    return {
        ipAddress: (0, rate_limit_middleware_js_1.getClientIp)(req),
        ...(userAgent ? { userAgent } : {}),
    };
}
async function register(req, res, next) {
    try {
        const input = (0, auth_validation_js_1.validateRegistrationInput)(req.body);
        const result = await (0, auth_service_js_1.registerUser)(input, extractRequestMeta(req));
        (0, apiResponse_js_1.sendResponse)(res, 201, "User registered successfully.", result);
    }
    catch (error) {
        next(error);
    }
}
async function login(req, res, next) {
    try {
        const input = (0, auth_validation_js_1.validateLoginInput)(req.body);
        const result = await (0, auth_service_js_1.loginUser)(input, extractRequestMeta(req));
        (0, apiResponse_js_1.sendResponse)(res, 200, "Login successful.", result);
    }
    catch (error) {
        next(error);
    }
}
async function refresh(req, res, next) {
    try {
        const input = (0, auth_validation_js_1.validateRefreshTokenInput)(req.body);
        const result = await (0, auth_service_js_1.refreshSessionTokens)(input.refreshToken, extractRequestMeta(req));
        (0, apiResponse_js_1.sendResponse)(res, 200, "Tokens refreshed successfully.", result);
    }
    catch (error) {
        next(error);
    }
}
async function logout(req, res, next) {
    try {
        if (!req.user) {
            return next(apiError_js_1.ApiError.unauthorized("Authentication required."));
        }
        const input = (0, auth_validation_js_1.validateLogoutInput)(req.body);
        await (0, auth_service_js_1.logoutSession)(req.user.id, req.user.familyId, input.refreshToken);
        (0, apiResponse_js_1.sendResponse)(res, 200, "Logged out of current session successfully.");
    }
    catch (error) {
        next(error);
    }
}
async function logoutAll(req, res, next) {
    try {
        if (!req.user) {
            return next(apiError_js_1.ApiError.unauthorized("Authentication required."));
        }
        await (0, auth_service_js_1.logoutAllDevices)(req.user.id);
        (0, apiResponse_js_1.sendResponse)(res, 200, "Logged out of all devices successfully.");
    }
    catch (error) {
        next(error);
    }
}
async function getMe(req, res, next) {
    try {
        if (!req.user) {
            return next(apiError_js_1.ApiError.unauthorized("Authentication required."));
        }
        const user = await (0, auth_service_js_1.getCurrentUser)(req.user.id);
        (0, apiResponse_js_1.sendResponse)(res, 200, "Current user profile retrieved successfully.", user);
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=auth.controller.js.map