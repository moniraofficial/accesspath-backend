"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LOGIN_IP_EMAIL_MAX_ATTEMPTS = exports.LOGIN_IP_EMAIL_WINDOW_MS = exports.LOGIN_IP_MAX_ATTEMPTS = exports.LOGIN_IP_WINDOW_MS = void 0;
exports.atomicIncrementCounter = atomicIncrementCounter;
exports.isCounterBlocked = isCounterBlocked;
exports.buildIpKey = buildIpKey;
exports.buildIpEmailKey = buildIpEmailKey;
exports.isLoginBlocked = isLoginBlocked;
exports.recordFailedLogin = recordFailedLogin;
exports.resetIpEmailFailedLogin = resetIpEmailFailedLogin;
const failed_login_model_js_1 = require("../models/failed-login.model.js");
const MAX_ATOMIC_RETRIES = 3;
exports.LOGIN_IP_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
exports.LOGIN_IP_MAX_ATTEMPTS = 30;
exports.LOGIN_IP_EMAIL_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
exports.LOGIN_IP_EMAIL_MAX_ATTEMPTS = 5;
function isDuplicateOrTransientError(error) {
    if (!error || typeof error !== "object") {
        return false;
    }
    const err = error;
    return err.code === 11000 || err.code === 112 || err.codeName === "WriteConflict";
}
/**
 * Atomically increments a sliding/fixed-window counter in MongoDB using an
 * aggregation-pipeline findOneAndUpdate.
 *
 * Why this prevents lost-update races:
 * - If the record is missing OR expired (expiresAt <= now), it atomically sets attempts = 1
 *   and resets expiresAt = now + windowMs in a single server-side operation.
 * - If the record exists and is non-expired, it atomically increments attempts by 1 and
 *   preserves the existing expiresAt.
 * - Retries up to MAX_ATOMIC_RETRIES times on E11000 duplicate-key races during concurrent first-inserts.
 */
async function atomicIncrementCounter(key, windowMs) {
    for (let attempt = 0; attempt < MAX_ATOMIC_RETRIES; attempt++) {
        const now = new Date();
        const nextExpiresAt = new Date(now.getTime() + windowMs);
        try {
            const updated = await failed_login_model_js_1.FailedLogin.findOneAndUpdate({ key }, [
                {
                    $set: {
                        key,
                        attempts: {
                            $cond: {
                                if: {
                                    $or: [
                                        { $eq: [{ $type: "$expiresAt" }, "missing"] },
                                        { $lte: ["$expiresAt", now] },
                                    ],
                                },
                                then: 1,
                                else: { $add: [{ $ifNull: ["$attempts", 0] }, 1] },
                            },
                        },
                        expiresAt: {
                            $cond: {
                                if: {
                                    $or: [
                                        { $eq: [{ $type: "$expiresAt" }, "missing"] },
                                        { $lte: ["$expiresAt", now] },
                                    ],
                                },
                                then: nextExpiresAt,
                                else: "$expiresAt",
                            },
                        },
                    },
                },
            ], {
                upsert: true,
                returnDocument: "after",
                updatePipeline: true,
            }).lean();
            if (!updated) {
                throw new Error("Atomic counter update returned null.");
            }
            return {
                attempts: updated.attempts,
                expiresAt: updated.expiresAt,
            };
        }
        catch (error) {
            if (isDuplicateOrTransientError(error) && attempt < MAX_ATOMIC_RETRIES - 1) {
                continue;
            }
            throw error;
        }
    }
    throw new Error("Exceeded maximum retries for atomic counter increment.");
}
/**
 * Checks whether a counter key has reached or exceeded `maxAttempts` within an active window.
 */
async function isCounterBlocked(key, maxAttempts) {
    const now = new Date();
    const record = await failed_login_model_js_1.FailedLogin.findOne({
        key,
        expiresAt: { $gt: now },
    })
        .select("attempts")
        .lean();
    return Boolean(record && record.attempts >= maxAttempts);
}
function buildIpKey(ip) {
    return `login:ip:${ip}`;
}
function buildIpEmailKey(ip, normalizedEmail) {
    return `login:ip_email:${ip}:${normalizedEmail}`;
}
/**
 * Checks both IP-wide and IP+email failed-login counters before authentication.
 */
async function isLoginBlocked(ip, normalizedEmail) {
    const [ipBlocked, ipEmailBlocked] = await Promise.all([
        isCounterBlocked(buildIpKey(ip), exports.LOGIN_IP_MAX_ATTEMPTS),
        isCounterBlocked(buildIpEmailKey(ip, normalizedEmail), exports.LOGIN_IP_EMAIL_MAX_ATTEMPTS),
    ]);
    return ipBlocked || ipEmailBlocked;
}
/**
 * Atomically records a failed login attempt on both the IP-wide and IP+email counters.
 */
async function recordFailedLogin(ip, normalizedEmail) {
    await Promise.all([
        atomicIncrementCounter(buildIpKey(ip), exports.LOGIN_IP_WINDOW_MS),
        atomicIncrementCounter(buildIpEmailKey(ip, normalizedEmail), exports.LOGIN_IP_EMAIL_WINDOW_MS),
    ]);
}
/**
 * Resets ONLY the IP+email-specific counter after a successful login.
 * Intentionally preserves the IP-wide counter so one valid account login
 * does not clear brute-force tracking against other accounts from that IP.
 */
async function resetIpEmailFailedLogin(ip, normalizedEmail) {
    await failed_login_model_js_1.FailedLogin.deleteOne({ key: buildIpEmailKey(ip, normalizedEmail) });
}
//# sourceMappingURL=rate-limit.service.js.map