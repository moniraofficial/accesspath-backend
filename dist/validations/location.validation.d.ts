import { IAccessibilityFeatures, IGeoPoint, LocationCategoryType, VerificationStatusType } from "../types/location.types.js";
export interface ICreateLocationInput {
    name: string;
    description: string;
    address: string;
    location: IGeoPoint;
    category: LocationCategoryType;
    accessibilityFeatures: IAccessibilityFeatures;
    photos: string[];
}
export interface IUpdateLocationInput {
    name?: string;
    description?: string;
    address?: string;
    location?: IGeoPoint;
    category?: LocationCategoryType;
    accessibilityFeatures?: IAccessibilityFeatures;
    photos?: string[];
}
export interface IVerifyLocationInput {
    status: "verified" | "rejected";
    rejectionReason?: string;
}
export type LocationSortField = "createdAt" | "accessibilityScore" | "name" | "distance";
export type SortOrder = "asc" | "desc";
export interface ILocationQuery {
    page: number;
    limit: number;
    search?: string;
    category?: LocationCategoryType;
    verificationStatus?: VerificationStatusType;
    submittedBy?: string;
    lat?: number;
    lng?: number;
    radiusKm: number;
    sortBy: LocationSortField;
    sortOrder: SortOrder;
    features: Partial<IAccessibilityFeatures>;
}
export declare function validateObjectIdParam(id: unknown, label?: string): string;
export declare function validateCreateLocationInput(data: unknown): ICreateLocationInput;
export declare function validateUpdateLocationInput(data: unknown): IUpdateLocationInput;
export declare function validateVerifyLocationInput(data: unknown): IVerifyLocationInput;
export declare function validateLocationQuery(query: unknown): ILocationQuery;
//# sourceMappingURL=location.validation.d.ts.map