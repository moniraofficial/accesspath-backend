export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errors?: unknown;

  constructor(
    statusCode: number,
    message: string,
    errors?: unknown,
    isOperational: boolean = true,
    stack: string = ""
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    if (errors !== undefined) {
      this.errors = errors;
    }

    Object.setPrototypeOf(this, new.target.prototype);

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  static badRequest(message: string = "Bad Request", errors?: unknown): ApiError {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message: string = "Unauthorized", errors?: unknown): ApiError {
    return new ApiError(401, message, errors);
  }

  static forbidden(message: string = "Forbidden", errors?: unknown): ApiError {
    return new ApiError(403, message, errors);
  }

  static notFound(message: string = "Resource Not Found", errors?: unknown): ApiError {
    return new ApiError(404, message, errors);
  }

  static conflict(message: string = "Conflict", errors?: unknown): ApiError {
    return new ApiError(409, message, errors);
  }

  static unprocessable(message: string = "Unprocessable Entity", errors?: unknown): ApiError {
    return new ApiError(422, message, errors);
  }

  static internal(message: string = "Internal Server Error", errors?: unknown): ApiError {
    return new ApiError(500, message, errors, false);
  }
}
