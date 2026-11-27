import type { Request, Response, NextFunction } from "express";
import {
  validateCreateFeedbackInput,
  validateFeedbackQuery,
  validateModerateFeedbackInput,
  validateUpdateFeedbackInput,
} from "../validations/feedback.validation.js";
import { validateObjectIdParam } from "../validations/location.validation.js";
import {
  createFeedback,
  deleteFeedback,
  listFeedback,
  moderateFeedback,
  updateFeedback,
} from "../services/feedback.service.js";
import { sendResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";

export async function create(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      return next(ApiError.unauthorized("Authentication required."));
    }
    const input = validateCreateFeedbackInput(req.body);
    const created = await createFeedback(input, req.user);
    sendResponse(res, 201, "Feedback submitted successfully.", created);
  } catch (error: unknown) {
    next(error);
  }
}

export async function list(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const query = validateFeedbackQuery(req.query);
    const { items, meta } = await listFeedback(query, req.user);
    sendResponse(res, 200, "Feedback retrieved successfully.", items, meta);
  } catch (error: unknown) {
    next(error);
  }
}

export async function update(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      return next(ApiError.unauthorized("Authentication required."));
    }
    const id = validateObjectIdParam(req.params.id, "feedback ID");
    const updates = validateUpdateFeedbackInput(req.body);
    const updated = await updateFeedback(id, updates, req.user);
    sendResponse(res, 200, "Feedback updated successfully.", updated);
  } catch (error: unknown) {
    next(error);
  }
}

export async function remove(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      return next(ApiError.unauthorized("Authentication required."));
    }
    const id = validateObjectIdParam(req.params.id, "feedback ID");
    const deleted = await deleteFeedback(id, req.user);
    sendResponse(res, 200, "Feedback deleted successfully.", deleted);
  } catch (error: unknown) {
    next(error);
  }
}

export async function moderate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      return next(ApiError.unauthorized("Authentication required."));
    }
    const id = validateObjectIdParam(req.params.id, "feedback ID");
    const input = validateModerateFeedbackInput(req.body);
    const updated = await moderateFeedback(id, input, req.user);
    sendResponse(res, 200, `Feedback ${input.status} successfully.`, updated);
  } catch (error: unknown) {
    next(error);
  }
}
