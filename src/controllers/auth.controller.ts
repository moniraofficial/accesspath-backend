import type { Request, Response, NextFunction } from "express";
import {
  validateRegistrationInput,
  validateLoginInput,
  validateRefreshTokenInput,
  validateLogoutInput,
} from "../validations/auth.validation.js";
import {
  registerUser,
  loginUser,
  refreshSessionTokens,
  logoutSession,
  logoutAllDevices,
  getCurrentUser,
  IRequestMetadata,
} from "../services/auth.service.js";
import { getClientIp } from "../middlewares/rate-limit.middleware.js";
import { sendResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";

function extractRequestMeta(req: Request): IRequestMetadata {
  const userAgent = req.get("user-agent");
  return {
    ipAddress: getClientIp(req),
    ...(userAgent ? { userAgent } : {}),
  };
}

export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = validateRegistrationInput(req.body);
    const result = await registerUser(input, extractRequestMeta(req));
    sendResponse(res, 201, "User registered successfully.", result);
  } catch (error: unknown) {
    next(error);
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = validateLoginInput(req.body);
    const result = await loginUser(input, extractRequestMeta(req));
    sendResponse(res, 200, "Login successful.", result);
  } catch (error: unknown) {
    next(error);
  }
}

export async function refresh(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = validateRefreshTokenInput(req.body);
    const result = await refreshSessionTokens(input.refreshToken, extractRequestMeta(req));
    sendResponse(res, 200, "Tokens refreshed successfully.", result);
  } catch (error: unknown) {
    next(error);
  }
}

export async function logout(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      return next(ApiError.unauthorized("Authentication required."));
    }
    const input = validateLogoutInput(req.body);
    await logoutSession(req.user.id, req.user.familyId, input.refreshToken);
    sendResponse(res, 200, "Logged out of current session successfully.");
  } catch (error: unknown) {
    next(error);
  }
}

export async function logoutAll(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      return next(ApiError.unauthorized("Authentication required."));
    }
    await logoutAllDevices(req.user.id);
    sendResponse(res, 200, "Logged out of all devices successfully.");
  } catch (error: unknown) {
    next(error);
  }
}

export async function getMe(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      return next(ApiError.unauthorized("Authentication required."));
    }
    const user = await getCurrentUser(req.user.id);
    sendResponse(res, 200, "Current user profile retrieved successfully.", user);
  } catch (error: unknown) {
    next(error);
  }
}
