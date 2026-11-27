import type { Request, Response, NextFunction } from "express";
import {
  validateCreateLocationInput,
  validateLocationQuery,
  validateObjectIdParam,
  validateUpdateLocationInput,
  validateVerifyLocationInput,
} from "../validations/location.validation.js";
import {
  createLocation,
  deleteLocation,
  getLocationById,
  listLocations,
  updateLocation,
  verifyLocation,
} from "../services/location.service.js";
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
    const input = validateCreateLocationInput(req.body);
    const created = await createLocation(input, req.user);
    sendResponse(res, 201, "Location submitted successfully.", created);
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
    const query = validateLocationQuery(req.query);
    const { items, meta } = await listLocations(query);
    sendResponse(res, 200, "Locations retrieved successfully.", items, meta);
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
    const id = validateObjectIdParam(req.params.id, "location ID");
    const location = await getLocationById(id);
    sendResponse(res, 200, "Location details retrieved successfully.", location);
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
    const id = validateObjectIdParam(req.params.id, "location ID");
    const updates = validateUpdateLocationInput(req.body);
    const updated = await updateLocation(id, updates, req.user);
    sendResponse(res, 200, "Location updated successfully.", updated);
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
    const id = validateObjectIdParam(req.params.id, "location ID");
    const deleted = await deleteLocation(id, req.user);
    sendResponse(res, 200, "Location deleted successfully.", deleted);
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
    const id = validateObjectIdParam(req.params.id, "location ID");
    const input = validateVerifyLocationInput(req.body);
    const verified = await verifyLocation(id, input, req.user);
    sendResponse(res, 200, `Location ${input.status} successfully.`, verified);
  } catch (error: unknown) {
    next(error);
  }
}
