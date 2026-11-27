import { BarrierCategoryType, BarrierStatusType } from "../types/barrier.types.js";
import { IGeoPoint } from "../types/location.types.js";
export interface ICreateBarrierInput {
    category: BarrierCategoryType;
    description: string;
    imageUrl?: string;
    location: IGeoPoint;
}
export interface IUpdateBarrierInput {
    category?: BarrierCategoryType;
    description?: string;
    imageUrl?: string;
    location?: IGeoPoint;
}
export interface IVerifyBarrierInput {
    status: "verified" | "rejected" | "resolved";
    rejectionReason?: string;
}
export interface IBarrierQuery {
    page: number;
    limit: number;
    search?: string;
    category?: BarrierCategoryType;
    status?: BarrierStatusType;
    reportedBy?: string;
    lat?: number;
    lng?: number;
    radiusKm: number;
    sortBy: "createdAt" | "distance";
    sortOrder: "asc" | "desc";
}
export declare function validateCreateBarrierInput(data: unknown): ICreateBarrierInput;
export declare function validateUpdateBarrierInput(data: unknown): IUpdateBarrierInput;
export declare function validateVerifyBarrierInput(data: unknown): IVerifyBarrierInput;
export declare function validateBarrierQuery(query: unknown): IBarrierQuery;
//# sourceMappingURL=barrier.validation.d.ts.map