import type { Request } from "express";
import { UserRoleType } from "../config/roles.js";
export * from "./user.types.js";
export * from "./refresh-token.types.js";
export * from "./failed-login.types.js";
export * from "./location.types.js";
export * from "./barrier.types.js";
export * from "./feedback.types.js";
export * from "./favorite.types.js";
export * from "./route.types.js";
export interface IAuthUser {
    id: string;
    email: string;
    role: UserRoleType;
    tokenVersion?: number;
    familyId?: string;
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