import type { Request } from "express";
import { UserRoleType } from "../config/roles.js";
export * from "./user.types.js";
export interface IAuthUser {
    id: string;
    email: string;
    role: UserRoleType;
    tokenVersion?: number;
}
export interface IPaginationMeta {
    page: number;
    limit: number;
    totalRecords: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}
export interface IApiResponse<T = unknown> {
    success: boolean;
    statusCode: number;
    message: string;
    data?: T;
    meta?: IPaginationMeta | Record<string, unknown>;
}
export interface IApiErrorResponse {
    success: false;
    statusCode: number;
    message: string;
    errors?: unknown;
    stack?: string;
}
declare global {
    namespace Express {
        interface Request {
            user?: IAuthUser;
        }
    }
}
export interface AuthenticatedRequest extends Request {
    user: IAuthUser;
}
//# sourceMappingURL=index.d.ts.map