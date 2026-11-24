import type { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import { ApiError } from "../utils/apiError.js";
import { IApiErrorResponse } from "../types/index.js";

export const errorHandler: ErrorRequestHandler = (
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  const isProduction = process.env.NODE_ENV === "production";

  let statusCode = 500;
  let message = "Internal Server Error";
  let errors: unknown = undefined;
  let isOperational = false;
  let stack: string | undefined = undefined;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
    isOperational = err.isOperational;
    stack = err.stack;
  } else if (
    err instanceof SyntaxError &&
    "status" in err &&
    (err as { status: unknown }).status === 400 &&
    "body" in err
  ) {
    // Malformed JSON payload parsed by express.json()
    statusCode = 400;
    message = "Invalid JSON payload in request body";
    isOperational = true;
  } else if (err instanceof Error) {
    message = isProduction ? "An unexpected error occurred" : err.message;
    stack = err.stack;
  }

  const responseBody: IApiErrorResponse = {
    success: false,
    statusCode,
    message,
    ...(errors !== undefined && { errors }),
    ...(!isProduction && stack !== undefined && { stack }),
  };

  if (!isOperational && statusCode === 500) {
    console.error(`[Unhandled Error] ${req.method} ${req.originalUrl}:`, err);
  }

  res.status(statusCode).json(responseBody);
};

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  next(new ApiError(404, `Endpoint not found: ${req.method} ${req.originalUrl}`));
};
