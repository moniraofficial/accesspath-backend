import { Response } from "express";
import { IApiResponse, IPaginationMeta } from "../types/index.js";
export declare class ApiResponse<T = unknown> {
    readonly success: boolean;
    readonly statusCode: number;
    readonly message: string;
    readonly data?: T;
    readonly meta?: IPaginationMeta | Record<string, unknown>;
    constructor(statusCode: number, message: string, data?: T, meta?: IPaginationMeta | Record<string, unknown>);
    toJSON(): IApiResponse<T>;
    send(res: Response): Response;
}
export declare const sendResponse: <T>(res: Response, statusCode: number, message: string, data?: T, meta?: IPaginationMeta | Record<string, unknown>) => Response;
//# sourceMappingURL=apiResponse.d.ts.map