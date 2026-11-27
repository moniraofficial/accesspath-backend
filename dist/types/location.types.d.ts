import { Types, Document } from "mongoose";
export declare const LocationCategory: {
    readonly PUBLIC_BUILDINGS: "Public Buildings";
    readonly PARKS: "Parks";
    readonly EDUCATIONAL_INSTITUTIONS: "Educational Institutions";
    readonly TRANSPORTATION_FACILITIES: "Transportation Facilities";
    readonly GOVERNMENT_OFFICES: "Government Offices";
    readonly COMMUNITY_CENTERS: "Community Centers";
};
export type LocationCategoryType = (typeof LocationCategory)[keyof typeof LocationCategory];
export declare const ALL_LOCATION_CATEGORIES: readonly LocationCategoryType[];
export declare const VerificationStatus: {
    readonly PENDING: "pending";
    readonly VERIFIED: "verified";
    readonly REJECTED: "rejected";
};
export type VerificationStatusType = (typeof VerificationStatus)[keyof typeof VerificationStatus];
export declare const ALL_VERIFICATION_STATUSES: readonly VerificationStatusType[];
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
//# sourceMappingURL=location.types.d.ts.map