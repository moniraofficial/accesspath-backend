import type { Request, Response, NextFunction } from "express";
import {
  validateBarrierQuery,
  validateCreateBarrierInput,
  validateUpdateBarrierInput,
  validateVerifyBarrierInput,
} from "../validations/barrier.validation.js";
import { validateObjectIdParam } from "../validations/location.validation.js";
import {
  createBarrier,
  deleteBarrier,
  getBarrierById,
  listBarriers,
  updateBarrier,
  verifyBarrier,
} from "../services/barrier.service.js";
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
    const input = validateCreateBarrierInput(req.body);
    const created = await createBarrier(input, req.user);
    sendResponse(res, 201, "Barrier report submitted successfully.", created);
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
    const query = validateBarrierQuery(req.query);
    const { items, meta } = await listBarriers(query);
    sendResponse(res, 200, "Barrier reports retrieved successfully.", items, meta);
  } catch (error: unknown) {
    next(error);
  }
}

export async function listMyReports(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      return next(ApiError.unauthorized("Authentication required."));
    }
    const query = validateBarrierQuery({ ...req.query, reportedBy: req.user.id });
    const { items, meta } = await listBarriers(query);
    sendResponse(res, 200, "Your barrier reports retrieved successfully.", items, meta);
  } catch (error: unknown) {
    next(error);
  }
}

export async function getById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = validateObjectIdParam(req.params.id, "barrier ID");
    const barrier = await getBarrierById(id);
    sendResponse(res, 200, "Barrier report retrieved successfully.", barrier);
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
    const id = validateObjectIdParam(req.params.id, "barrier ID");
    const updates = validateUpdateBarrierInput(req.body);
    const updated = await updateBarrier(id, updates, req.user);
    sendResponse(res, 200, "Barrier report updated successfully.", updated);
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
    const id = validateObjectIdParam(req.params.id, "barrier ID");
    const deleted = await deleteBarrier(id, req.user);
    sendResponse(res, 200, "Barrier report deleted successfully.", deleted);
  } catch (error: unknown) {
    next(error);
  }
}

export async function verify(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      return next(ApiError.unauthorized("Authentication required."));
    }
    const id = validateObjectIdParam(req.params.id, "barrier ID");
    const input = validateVerifyBarrierInput(req.body);
    const verified = await verifyBarrier(id, input, req.user);
    sendResponse(res, 200, `Barrier report ${input.status} successfully.`, verified);
  } catch (error: unknown) {
    next(error);
  }
}
