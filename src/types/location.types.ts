import { Types, Document } from "mongoose";

export const LocationCategory = {
  PUBLIC_BUILDINGS: "Public Buildings",
  PARKS: "Parks",
  EDUCATIONAL_INSTITUTIONS: "Educational Institutions",
  TRANSPORTATION_FACILITIES: "Transportation Facilities",
  GOVERNMENT_OFFICES: "Government Offices",
  COMMUNITY_CENTERS: "Community Centers",
} as const;

export type LocationCategoryType = (typeof LocationCategory)[keyof typeof LocationCategory];

export const ALL_LOCATION_CATEGORIES: readonly LocationCategoryType[] = [
  LocationCategory.PUBLIC_BUILDINGS,
  LocationCategory.PARKS,
  LocationCategory.EDUCATIONAL_INSTITUTIONS,
  LocationCategory.TRANSPORTATION_FACILITIES,
  LocationCategory.GOVERNMENT_OFFICES,
  LocationCategory.COMMUNITY_CENTERS,
] as const;

export const VerificationStatus = {
  PENDING: "pending",
  VERIFIED: "verified",
  REJECTED: "rejected",
} as const;

export type VerificationStatusType =
  (typeof VerificationStatus)[keyof typeof VerificationStatus];

export const ALL_VERIFICATION_STATUSES: readonly VerificationStatusType[] = [
  VerificationStatus.PENDING,
  VerificationStatus.VERIFIED,
  VerificationStatus.REJECTED,
] as const;

export interface IAccessibilityFeatures {
  wheelchairAccess: boolean;
  rampAvailability: boolean;
  elevatorAvailability: boolean;
  accessibleRestroom: boolean;
  accessibleParking: boolean;
  stairFreeEntry: boolean;
  doorAccessibility: boolean;
}

export interface IGeoPoint {
  type: "Point";
  /** [longitude, latitude] per GeoJSON RFC 7946 */
  coordinates: [number, number];
}

export interface ILocation {
  name: string;
  description: string;
  address: string;
  location: IGeoPoint;
  category: LocationCategoryType;
  accessibilityScore: number;
  accessibilityFeatures: IAccessibilityFeatures;
  photos: string[];
  verificationStatus: VerificationStatusType;
  rejectionReason?: string;
  submittedBy: Types.ObjectId;
  verifiedBy?: Types.ObjectId;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILocationDocument extends ILocation, Document {
  _id: Types.ObjectId;
}

export interface ILocationResponse {
  id: string;
  name: string;
  description: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  location: IGeoPoint;
  category: LocationCategoryType;
  accessibilityScore: number;
  accessibilityFeatures: IAccessibilityFeatures;
  photos: string[];
  verificationStatus: VerificationStatusType;
  isVerified: boolean;
  rejectionReason?: string;
  submittedBy: string;
  verifiedBy?: string;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
