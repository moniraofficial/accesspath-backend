"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.errorHandler = void 0;
const apiError_js_1 = require("../utils/apiError.js");
const errorHandler = (err, req, res, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
next) => {
    const isProduction = process.env.NODE_ENV === "production";
    let statusCode = 500;
    let message = "Internal Server Error";
    let errors = undefined;
    let isOperational = false;
    let stack = undefined;
    if (err instanceof apiError_js_1.ApiError) {
        statusCode = err.statusCode;
        message = err.message;
        errors = err.errors;
        isOperational = err.isOperational;
        stack = err.stack;
    }
    else if (err instanceof SyntaxError &&
        "status" in err &&
        err.status === 400 &&
        "body" in err) {
        // Malformed JSON payload parsed by express.json()
        statusCode = 400;
        message = "Invalid JSON payload in request body";
        isOperational = true;
    }
    else if (err instanceof Error) {
        message = isProduction ? "An unexpected error occurred" : err.message;
        stack = err.stack;
    }
    const responseBody = {
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
exports.errorHandler = errorHandler;
const notFoundHandler = (req, res, next) => {
    next(new apiError_js_1.ApiError(404, `Endpoint not found: ${req.method} ${req.originalUrl}`));
};
exports.notFoundHandler = notFoundHandler;
//# sourceMappingURL=error.middleware.js.map