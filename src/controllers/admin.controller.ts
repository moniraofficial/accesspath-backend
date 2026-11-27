import type { Request, Response, NextFunction } from "express";
import {
  validateAdminUpdateUserInput,
  validateAdminUsersQuery,
} from "../validations/admin.validation.js";
import { validateObjectIdParam } from "../validations/location.validation.js";
import {
  getPlatformAnalytics,
  listUsersForAdmin,
  updateUserByAdmin,
} from "../services/admin.service.js";
import { sendResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";

export async function listUsers(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const query = validateAdminUsersQuery(req.query);
    const { items, meta } = await listUsersForAdmin(query);
    sendResponse(res, 200, "Users retrieved successfully.", items, meta);
  } catch (error: unknown) {
    next(error);
  }
}

export async function updateUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      return next(ApiError.unauthorized("Authentication required."));
    }
    const id = validateObjectIdParam(req.params.id, "user ID");
    const updates = validateAdminUpdateUserInput(req.body);
    const updated = await updateUserByAdmin(id, updates, req.user);
    sendResponse(res, 200, "User updated successfully.", updated);
  } catch (error: unknown) {
    next(error);
  }
}

export async function analytics(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = await getPlatformAnalytics();
    sendResponse(res, 200, "Platform analytics retrieved successfully.", data);
  } catch (error: unknown) {
    next(error);
  }
}
