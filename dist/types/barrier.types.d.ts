import { Types, Document } from "mongoose";
import { IGeoPoint } from "./location.types.js";
export declare const BarrierCategory: {
    readonly BROKEN_FOOTPATH: "Broken Footpath";
    readonly MISSING_RAMP: "Missing Ramp";
    readonly BLOCKED_SIDEWALK: "Blocked Sidewalk";
    readonly BROKEN_ELEVATOR: "Broken Elevator";
    readonly UNSAFE_CROSSING: "Unsafe Crossing";
};
export type BarrierCategoryType = (typeof BarrierCategory)[keyof typeof BarrierCategory];
export declare const ALL_BARRIER_CATEGORIES: readonly BarrierCategoryType[];
export declare const BarrierStatus: {
    readonly PENDING: "pending";
    readonly VERIFIED: "verified";
    readonly REJECTED: "rejected";
    readonly RESOLVED: "resolved";
};
export type BarrierStatusType = (typeof BarrierStatus)[keyof typeof BarrierStatus];
export declare const ALL_BARRIER_STATUSES: readonly BarrierStatusType[];
export interface IBarrier {
    category: BarrierCategoryType;
    description: string;
    imageUrl?: string;
    location: IGeoPoint;
    reportedBy: Types.ObjectId;
    status: BarrierStatusType;
    rejectionReason?: string;
    verifiedBy?: Types.ObjectId;
    verifiedAt?: Date;
    resolvedBy?: Types.ObjectId;
    resolvedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface IBarrierDocument extends IBarrier, Document {
    _id: Types.ObjectId;
}
export interface IBarrierResponse {
    id: string;
    category: BarrierCategoryType;
    description: string;
    imageUrl?: string;
    coordinates: {
        latitude: number;
        longitude: number;
    };
    location: IGeoPoint;
    reportedBy: string;
    status: BarrierStatusType;
    isVerified: boolean;
    rejectionReason?: string;
    verifiedBy?: string;
    verifiedAt?: Date;
    resolvedBy?: string;
    resolvedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=barrier.types.d.ts.map