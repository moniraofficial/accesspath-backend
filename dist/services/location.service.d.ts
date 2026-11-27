import mongoose from "mongoose";
import { IAuthUser, IPaginationMeta } from "../types/index.js";
import { IAccessibilityFeatures, ILocationDocument, ILocationResponse } from "../types/location.types.js";
import { ICreateLocationInput, ILocationQuery, IUpdateLocationInput, IVerifyLocationInput } from "../validations/location.validation.js";
/**
 * Computes a deterministic 0-100 accessibility score from the 7 boolean attributes.
 */
export declare function calculateAccessibilityScore(features: IAccessibilityFeatures): number;
export declare function toLocationResponse(doc: ILocationDocument | (Record<string, any> & {
    _id: mongoose.Types.ObjectId;
})): ILocationResponse;
export declare function createLocation(input: ICreateLocationInput, currentUser: IAuthUser): Promise<ILocationResponse>;
export declare function listLocations(query: ILocationQuery): Promise<{
    items: ILocationResponse[];
    meta: IPaginationMeta;
}>;
export declare function getLocationById(locationId: string): Promise<ILocationResponse>;
export declare function updateLocation(locationId: string, updates: IUpdateLocationInput, currentUser: IAuthUser): Promise<ILocationResponse>;
export declare function deleteLocation(locationId: string, currentUser: IAuthUser): Promise<{
    id: string;
}>;
export declare function verifyLocation(locationId: string, input: IVerifyLocationInput, currentUser: IAuthUser): Promise<ILocationResponse>;
//# sourceMappingURL=location.service.d.ts.map