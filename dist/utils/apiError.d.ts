export declare class ApiError extends Error {
    readonly statusCode: number;
    readonly isOperational: boolean;
    readonly errors?: unknown;
    constructor(statusCode: number, message: string, errors?: unknown, isOperational?: boolean, stack?: string);
    static badRequest(message?: string, errors?: unknown): ApiError;
    static unauthorized(message?: string, errors?: unknown): ApiError;
    static forbidden(message?: string, errors?: unknown): ApiError;
    static notFound(message?: string, errors?: unknown): ApiError;
    static conflict(message?: string, errors?: unknown): ApiError;
    static unprocessable(message?: string, errors?: unknown): ApiError;
    static internal(message?: string, errors?: unknown): ApiError;
}
//# sourceMappingURL=apiError.d.ts.map