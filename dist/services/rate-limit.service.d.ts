export declare const LOGIN_IP_WINDOW_MS: number;
export declare const LOGIN_IP_MAX_ATTEMPTS = 30;
export declare const LOGIN_IP_EMAIL_WINDOW_MS: number;
export declare const LOGIN_IP_EMAIL_MAX_ATTEMPTS = 5;
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
export declare function atomicIncrementCounter(key: string, windowMs: number): Promise<{
    attempts: number;
    expiresAt: Date;
}>;
/**
 * Checks whether a counter key has reached or exceeded `maxAttempts` within an active window.
 */
export declare function isCounterBlocked(key: string, maxAttempts: number): Promise<boolean>;
export declare function buildIpKey(ip: string): string;
export declare function buildIpEmailKey(ip: string, normalizedEmail: string): string;
/**
 * Checks both IP-wide and IP+email failed-login counters before authentication.
 */
export declare function isLoginBlocked(ip: string, normalizedEmail: string): Promise<boolean>;
/**
 * Atomically records a failed login attempt on both the IP-wide and IP+email counters.
 */
export declare function recordFailedLogin(ip: string, normalizedEmail: string): Promise<void>;
/**
 * Resets ONLY the IP+email-specific counter after a successful login.
 * Intentionally preserves the IP-wide counter so one valid account login
 * does not clear brute-force tracking against other accounts from that IP.
 */
export declare function resetIpEmailFailedLogin(ip: string, normalizedEmail: string): Promise<void>;
//# sourceMappingURL=rate-limit.service.d.ts.map