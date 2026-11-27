"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClientIp = getClientIp;
exports.createRateLimiter = createRateLimiter;
const rate_limit_service_js_1 = require("../services/rate-limit.service.js");
const apiError_js_1 = require("../utils/apiError.js");
/**
 * Extracts a normalized client IP string from an Express request.
 */
function getClientIp(req) {
    return req.ip || req.socket?.remoteAddress || "unknown";
}
/**
 * Creates a MongoDB-backed atomic rate-limiting middleware using FailedLogin counters.
 */
function createRateLimiter(options) {
    const { keyPrefix, windowMs, maxRequests, message = "Too many requests. Please try again later.", } = options;
    return async (req, res, next) => {
        try {
            const ip = getClientIp(req);
            const key = `rl:${keyPrefix}:${ip}`;
            const { attempts, expiresAt } = await (0, rate_limit_service_js_1.atomicIncrementCounter)(key, windowMs);
            const remaining = Math.max(0, maxRequests - attempts);
            res.setHeader("X-RateLimit-Limit", String(maxRequests));
            res.setHeader("X-RateLimit-Remaining", String(remaining));
            res.setHeader("X-RateLimit-Reset", String(Math.ceil(expiresAt.getTime() / 1000)));
            if (attempts > maxRequests) {
                return next(new apiError_js_1.ApiError(429, message));
            }
            return next();
        }
        catch (error) {
            return next(error);
        }
    };
}
//# sourceMappingURL=rate-limit.middleware.js.map