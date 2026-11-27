"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_js_1 = require("../controllers/auth.controller.js");
const auth_middleware_js_1 = require("../middlewares/auth.middleware.js");
const rate_limit_middleware_js_1 = require("../middlewares/rate-limit.middleware.js");
const router = (0, express_1.Router)();
const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
const registerLimiter = (0, rate_limit_middleware_js_1.createRateLimiter)({
    keyPrefix: "register",
    windowMs: FIFTEEN_MINUTES_MS,
    maxRequests: 20,
    message: "Too many registration attempts. Please try again later.",
});
const loginLimiter = (0, rate_limit_middleware_js_1.createRateLimiter)({
    keyPrefix: "login_flood",
    windowMs: FIFTEEN_MINUTES_MS,
    maxRequests: 60,
    message: "Too many login requests. Please try again later.",
});
const refreshLimiter = (0, rate_limit_middleware_js_1.createRateLimiter)({
    keyPrefix: "refresh",
    windowMs: FIFTEEN_MINUTES_MS,
    maxRequests: 60,
    message: "Too many token refresh requests. Please try again later.",
});
const logoutLimiter = (0, rate_limit_middleware_js_1.createRateLimiter)({
    keyPrefix: "logout",
    windowMs: FIFTEEN_MINUTES_MS,
    maxRequests: 30,
    message: "Too many logout requests. Please try again later.",
});
router.post("/register", registerLimiter, auth_controller_js_1.register);
router.post("/login", loginLimiter, auth_controller_js_1.login);
router.post("/refresh", refreshLimiter, auth_controller_js_1.refresh);
router.post("/logout", auth_middleware_js_1.authenticate, logoutLimiter, auth_controller_js_1.logout);
router.post("/logout-all", auth_middleware_js_1.authenticate, logoutLimiter, auth_controller_js_1.logoutAll);
router.get("/me", auth_middleware_js_1.authenticate, auth_controller_js_1.getMe);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map