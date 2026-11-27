import type { Request, Response, NextFunction } from "express";
import { atomicIncrementCounter } from "../services/rate-limit.service.js";
import { ApiError } from "../utils/apiError.js";

export interface IRateLimiterOptions {
  keyPrefix: string;
  windowMs: number;
  maxRequests: number;
  message?: string;
}

/**
 * Extracts a normalized client IP string from an Express request.
 */
export function getClientIp(req: Request): string {
  return req.ip || req.socket?.remoteAddress || "unknown";
}

/**
 * Creates a MongoDB-backed atomic rate-limiting middleware using FailedLogin counters.
 */
export function createRateLimiter(options: IRateLimiterOptions) {
  const {
    keyPrefix,
    windowMs,
    maxRequests,
    message = "Too many requests. Please try again later.",
  } = options;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ip = getClientIp(req);
      const key = `rl:${keyPrefix}:${ip}`;
      const { attempts, expiresAt } = await atomicIncrementCounter(key, windowMs);

      const remaining = Math.max(0, maxRequests - attempts);
      res.setHeader("X-RateLimit-Limit", String(maxRequests));
      res.setHeader("X-RateLimit-Remaining", String(remaining));
      res.setHeader("X-RateLimit-Reset", String(Math.ceil(expiresAt.getTime() / 1000)));

      if (attempts > maxRequests) {
        return next(new ApiError(429, message));
      }

      return next();
    } catch (error: unknown) {
      return next(error);
    }
  };
}
