import { Types, Document } from "mongoose";
import { IGeoPoint } from "./location.types.js";

export const BarrierCategory = {
  BROKEN_FOOTPATH: "Broken Footpath",
  MISSING_RAMP: "Missing Ramp",
  BLOCKED_SIDEWALK: "Blocked Sidewalk",
  BROKEN_ELEVATOR: "Broken Elevator",
  UNSAFE_CROSSING: "Unsafe Crossing",
} as const;

export type BarrierCategoryType = (typeof BarrierCategory)[keyof typeof BarrierCategory];

export const ALL_BARRIER_CATEGORIES: readonly BarrierCategoryType[] = [
  BarrierCategory.BROKEN_FOOTPATH,
  BarrierCategory.MISSING_RAMP,
  BarrierCategory.BLOCKED_SIDEWALK,
  BarrierCategory.BROKEN_ELEVATOR,
  BarrierCategory.UNSAFE_CROSSING,
] as const;

export const BarrierStatus = {
  PENDING: "pending",
  VERIFIED: "verified",
  REJECTED: "rejected",
  RESOLVED: "resolved",
} as const;

export type BarrierStatusType = (typeof BarrierStatus)[keyof typeof BarrierStatus];

export const ALL_BARRIER_STATUSES: readonly BarrierStatusType[] = [
  BarrierStatus.PENDING,
  BarrierStatus.VERIFIED,
  BarrierStatus.REJECTED,
  BarrierStatus.RESOLVED,
] as const;

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
