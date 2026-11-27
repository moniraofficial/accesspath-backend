import type { Request, Response, NextFunction } from "express";
export interface IRateLimiterOptions {
    keyPrefix: string;
    windowMs: number;
    maxRequests: number;
    message?: string;
}
/**
 * Extracts a normalized client IP string from an Express request.
 */
export declare function getClientIp(req: Request): string;
/**
 * Creates a MongoDB-backed atomic rate-limiting middleware using FailedLogin counters.
 */
export declare function createRateLimiter(options: IRateLimiterOptions): (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=rate-limit.middleware.d.ts.map