"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiError = void 0;
class ApiError extends Error {
    statusCode;
    isOperational;
    errors;
    constructor(statusCode, message, errors, isOperational = true, stack = "") {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        if (errors !== undefined) {
            this.errors = errors;
        }
        Object.setPrototypeOf(this, new.target.prototype);
        if (stack) {
            this.stack = stack;
        }
        else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
    static badRequest(message = "Bad Request", errors) {
        return new ApiError(400, message, errors);
    }
    static unauthorized(message = "Unauthorized", errors) {
        return new ApiError(401, message, errors);
    }
    static forbidden(message = "Forbidden", errors) {
        return new ApiError(403, message, errors);
    }
    static notFound(message = "Resource Not Found", errors) {
        return new ApiError(404, message, errors);
    }
    static conflict(message = "Conflict", errors) {
        return new ApiError(409, message, errors);
    }
    static unprocessable(message = "Unprocessable Entity", errors) {
        return new ApiError(422, message, errors);
    }
    static internal(message = "Internal Server Error", errors) {
        return new ApiError(500, message, errors, false);
    }
}
exports.ApiError = ApiError;
//# sourceMappingURL=apiError.js.map