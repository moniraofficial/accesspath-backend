import mongoose, { PipelineStage, SortOrder as MongooseSortOrder } from "mongoose";
import { Location } from "../models/location.model.js";
import { Permissions } from "../config/roles.js";
import { IAuthUser, IPaginationMeta } from "../types/index.js";
import {
  IAccessibilityFeatures,
  ILocationDocument,
  ILocationResponse,
  VerificationStatus,
} from "../types/location.types.js";
import {
  ICreateLocationInput,
  ILocationQuery,
  IUpdateLocationInput,
  IVerifyLocationInput,
} from "../validations/location.validation.js";
import {
  assertCanModerateResource,
  assertCanModifyOwnPendingResource,
  hasPermission,
} from "../utils/ownership.js";
import { ApiError } from "../utils/apiError.js";

const FEATURE_WEIGHTS: Record<keyof IAccessibilityFeatures, number> = {
  wheelchairAccess: 25,
  stairFreeEntry: 20,
  rampAvailability: 15,
  elevatorAvailability: 15,
  accessibleRestroom: 10,
  doorAccessibility: 10,
  accessibleParking: 5,
};

/**
 * Computes a deterministic 0-100 accessibility score from the 7 boolean attributes.
 */
export function calculateAccessibilityScore(features: IAccessibilityFeatures): number {
  let score = 0;
  for (const [key, weight] of Object.entries(FEATURE_WEIGHTS) as [
    keyof IAccessibilityFeatures,
    number,
  ][]) {
    if (features[key]) {
      score += weight;
    }
  }
  return score;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function toLocationResponse(
  doc: ILocationDocument | (Record<string, any> & { _id: mongoose.Types.ObjectId })
): ILocationResponse {
  const coords = doc.location?.coordinates ?? [0, 0];
  const lng = typeof coords[0] === "number" ? coords[0] : 0;
  const lat = typeof coords[1] === "number" ? coords[1] : 0;

  return {
    id: doc._id.toString(),
    name: doc.name,
    description: doc.description,
    address: doc.address,
    coordinates: {
      latitude: lat,
      longitude: lng,
    },
    location: doc.location,
    category: doc.category,
    accessibilityScore: doc.accessibilityScore,
    accessibilityFeatures: doc.accessibilityFeatures,
    photos: Array.isArray(doc.photos) ? doc.photos : [],
    verificationStatus: doc.verificationStatus,
    isVerified: doc.verificationStatus === VerificationStatus.VERIFIED,
    ...(doc.rejectionReason !== undefined ? { rejectionReason: doc.rejectionReason } : {}),
    submittedBy: doc.submittedBy.toString(),
    ...(doc.verifiedBy !== undefined ? { verifiedBy: doc.verifiedBy.toString() } : {}),
    ...(doc.verifiedAt !== undefined ? { verifiedAt: doc.verifiedAt } : {}),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function createLocation(
  input: ICreateLocationInput,
  currentUser: IAuthUser
): Promise<ILocationResponse> {
  const canCreate =
    hasPermission(currentUser.role, Permissions.SUBMIT_LOCATIONS) ||
    hasPermission(currentUser.role, Permissions.MANAGE_LOCATIONS);

  if (!canCreate) {
    throw ApiError.forbidden("Access Denied: You do not have permission to submit locations.");
  }

  const accessibilityScore = calculateAccessibilityScore(input.accessibilityFeatures);

  // Security: all newly created locations start as 'pending' regardless of caller role
  const created = await Location.create({
    name: input.name,
    description: input.description,
    address: input.address,
    location: input.location,
    category: input.category,
    accessibilityScore,
    accessibilityFeatures: input.accessibilityFeatures,
    photos: input.photos,
    verificationStatus: VerificationStatus.PENDING,
    submittedBy: new mongoose.Types.ObjectId(currentUser.id),
  });

  return toLocationResponse(created);
}

export async function listLocations(
  query: ILocationQuery
): Promise<{ items: ILocationResponse[]; meta: IPaginationMeta }> {
  const filter: Record<string, unknown> = {};

  if (query.category) {
    filter.category = query.category;
  }
  if (query.verificationStatus) {
    filter.verificationStatus = query.verificationStatus;
  }
  if (query.submittedBy) {
    filter.submittedBy = new mongoose.Types.ObjectId(query.submittedBy);
  }
  if (query.search) {
    const safePattern = new RegExp(escapeRegex(query.search), "i");
    filter.$or = [{ name: safePattern }, { address: safePattern }];
  }

  for (const [featureKey, featureVal] of Object.entries(query.features)) {
    if (featureVal !== undefined) {
      filter[`accessibilityFeatures.${featureKey}`] = featureVal;
    }
  }

  const skip = (query.page - 1) * query.limit;
  const sortDirection: 1 | -1 = query.sortOrder === "asc" ? 1 : -1;

  if (query.lat !== undefined && query.lng !== undefined) {
    const pipeline: PipelineStage[] = [
      {
        $geoNear: {
          near: { type: "Point", coordinates: [query.lng, query.lat] },
          distanceField: "distanceMeters",
          maxDistance: query.radiusKm * 1000,
          spherical: true,
          query: filter,
        },
      },
    ];

    if (query.sortBy !== "distance") {
      pipeline.push({ $sort: { [query.sortBy]: sortDirection, _id: 1 } });
    } else if (sortDirection === -1) {
      pipeline.push({ $sort: { distanceMeters: -1, _id: 1 } });
    }

    pipeline.push({
      $facet: {
        items: [{ $skip: skip }, { $limit: query.limit }],
        totalCount: [{ $count: "count" }],
      },
    });

    const [aggResult] = await Location.aggregate(pipeline);
    const rawItems = (aggResult?.items ?? []) as (Record<string, any> & {
      _id: mongoose.Types.ObjectId;
    })[];
    const totalRecords = (aggResult?.totalCount?.[0]?.count as number | undefined) ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalRecords / query.limit));

    return {
      items: rawItems.map(toLocationResponse),
      meta: {
        page: query.page,
        limit: query.limit,
        totalRecords,
        totalPages,
        hasNextPage: query.page < totalPages && totalRecords > 0,
        hasPrevPage: query.page > 1,
      },
    };
  }

  const sortSpec: Record<string, MongooseSortOrder> = {
    [query.sortBy === "distance" ? "createdAt" : query.sortBy]: sortDirection,
    _id: 1,
  };

  const [docs, totalRecords] = await Promise.all([
    Location.find(filter).sort(sortSpec).skip(skip).limit(query.limit).lean(),
    Location.countDocuments(filter),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalRecords / query.limit));

  return {
    items: docs.map((d) =>
      toLocationResponse(d as Record<string, any> & { _id: mongoose.Types.ObjectId })
    ),
    meta: {
      page: query.page,
      limit: query.limit,
      totalRecords,
      totalPages,
      hasNextPage: query.page < totalPages && totalRecords > 0,
      hasPrevPage: query.page > 1,
    },
  };
}

export async function getLocationById(locationId: string): Promise<ILocationResponse> {
  const location = await Location.findById(locationId).lean();
  if (!location) {
    throw ApiError.notFound("Location not found.");
  }
  return toLocationResponse(
    location as Record<string, any> & { _id: mongoose.Types.ObjectId }
  );
}

export async function updateLocation(
  locationId: string,
  updates: IUpdateLocationInput,
  currentUser: IAuthUser
): Promise<ILocationResponse> {
  const location = await Location.findById(locationId);
  if (!location) {
    throw ApiError.notFound("Location not found.");
  }

  if (!hasPermission(currentUser.role, Permissions.MANAGE_LOCATIONS)) {
    assertCanModifyOwnPendingResource(
      location.submittedBy,
      location.verificationStatus,
      currentUser,
      "location"
    );
  }

  if (updates.name !== undefined) location.name = updates.name;
  if (updates.description !== undefined) location.description = updates.description;
  if (updates.address !== undefined) location.address = updates.address;
  if (updates.location !== undefined) location.location = updates.location;
  if (updates.category !== undefined) location.category = updates.category;
  if (updates.photos !== undefined) location.photos = updates.photos;
  if (updates.accessibilityFeatures !== undefined) {
    location.accessibilityFeatures = updates.accessibilityFeatures;
    location.accessibilityScore = calculateAccessibilityScore(updates.accessibilityFeatures);
  }

  const saved = await location.save();
  return toLocationResponse(saved);
}

export async function deleteLocation(
  locationId: string,
  currentUser: IAuthUser
): Promise<{ id: string }> {
  const location = await Location.findById(locationId);
  if (!location) {
    throw ApiError.notFound("Location not found.");
  }

  if (!hasPermission(currentUser.role, Permissions.MANAGE_LOCATIONS)) {
    assertCanModifyOwnPendingResource(
      location.submittedBy,
      location.verificationStatus,
      currentUser,
      "location"
    );
  }

  await location.deleteOne();
  return { id: locationId };
}

export async function verifyLocation(
  locationId: string,
  input: IVerifyLocationInput,
  currentUser: IAuthUser
): Promise<ILocationResponse> {
  const location = await Location.findById(locationId);
  if (!location) {
    throw ApiError.notFound("Location not found.");
  }

  assertCanModerateResource(
    currentUser,
    location.submittedBy,
    Permissions.VERIFY_LOCATIONS,
    "location"
  );

  location.verificationStatus = input.status;
  location.verifiedBy = new mongoose.Types.ObjectId(currentUser.id);
  location.verifiedAt = new Date();

  if (input.status === VerificationStatus.REJECTED && input.rejectionReason) {
    location.rejectionReason = input.rejectionReason;
  } else {
    location.set("rejectionReason", undefined);
  }

  const saved = await location.save();
  return toLocationResponse(saved);
}
