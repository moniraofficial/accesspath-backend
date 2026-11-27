import type { Request, Response, NextFunction } from "express";
import { validatePaginationParams } from "../validations/feedback.validation.js";
import { validateObjectIdParam } from "../validations/location.validation.js";
import {
  addFavorite,
  listFavorites,
  removeFavorite,
} from "../services/favorite.service.js";
import { sendResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";

export async function add(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      return next(ApiError.unauthorized("Authentication required."));
    }
    const locationId = validateObjectIdParam(req.params.locationId, "location ID");
    const favorite = await addFavorite(locationId, req.user);
    sendResponse(res, 201, "Location added to favorites.", favorite);
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
    const locationId = validateObjectIdParam(req.params.locationId, "location ID");
    const result = await removeFavorite(locationId, req.user);
    sendResponse(res, 200, "Location removed from favorites.", result);
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
    if (!req.user) {
      return next(ApiError.unauthorized("Authentication required."));
    }
    const { page, limit } = validatePaginationParams(req.query);
    const { items, meta } = await listFavorites(req.user, page, limit);
    sendResponse(res, 200, "Favorite locations retrieved successfully.", items, meta);
  } catch (error: unknown) {
    next(error);
  }
}
