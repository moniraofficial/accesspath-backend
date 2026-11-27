import type { Request, Response, NextFunction } from "express";
import { validateDiscoverRoutesInput } from "../validations/route.validation.js";
import { discoverAccessibleRoutes } from "../services/route.service.js";
import { sendResponse } from "../utils/apiResponse.js";

export async function discover(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = validateDiscoverRoutesInput(req.body);
    const result = await discoverAccessibleRoutes(input);
    sendResponse(res, 200, "Accessible routes discovered successfully.", result);
  } catch (error: unknown) {
    next(error);
  }
}
