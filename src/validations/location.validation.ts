import mongoose from "mongoose";
import {
  ALL_LOCATION_CATEGORIES,
  ALL_VERIFICATION_STATUSES,
  IAccessibilityFeatures,
  IGeoPoint,
  LocationCategoryType,
  VerificationStatus,
  VerificationStatusType,
} from "../types/location.types.js";
import { ApiError } from "../utils/apiError.js";

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

const FEATURE_KEYS: readonly (keyof IAccessibilityFeatures)[] = [
  "wheelchairAccess",
  "rampAvailability",
  "elevatorAvailability",
  "accessibleRestroom",
  "accessibleParking",
  "stairFreeEntry",
  "doorAccessibility",
] as const;

const PROTECTED_LOCATION_FIELDS = [
  "verificationStatus",
  "verifiedBy",
  "verifiedAt",
  "submittedBy",
  "accessibilityScore",
  "rejectionReason",
] as const;

function rejectProtectedFields(body: Record<string, unknown>): void {
  for (const field of PROTECTED_LOCATION_FIELDS) {
    if (field in body && body[field] !== undefined) {
      throw ApiError.badRequest(`Field "${field}" cannot be set directly by clients.`);
    }
  }
}

function validateStringField(
  value: unknown,
  fieldName: string,
  min: number,
  max: number
): string {
  if (typeof value !== "string" || !value.trim()) {
    throw ApiError.badRequest(`${fieldName} is required and must be a non-empty string.`);
  }
  const trimmed = value.trim();
  if (trimmed.length < min || trimmed.length > max) {
    throw ApiError.badRequest(`${fieldName} must be between ${min} and ${max} characters.`);
  }
  return trimmed;
}

function validateCategory(value: unknown): LocationCategoryType {
  if (
    typeof value !== "string" ||
    !ALL_LOCATION_CATEGORIES.includes(value as LocationCategoryType)
  ) {
    throw ApiError.badRequest(
      `Invalid category. Must be one of: ${ALL_LOCATION_CATEGORIES.join(", ")}.`
    );
  }
  return value as LocationCategoryType;
}

function validateCoordinates(body: Record<string, unknown>): IGeoPoint {
  let lat: unknown;
  let lng: unknown;

  if ("coordinates" in body && body.coordinates !== undefined) {
    const coords = body.coordinates;
    if (!coords || typeof coords !== "object" || Array.isArray(coords)) {
      throw ApiError.badRequest("coordinates must be an object with latitude and longitude.");
    }
    const c = coords as Record<string, unknown>;
    lat = c.latitude;
    lng = c.longitude;
  } else if ("location" in body && body.location !== undefined) {
    const loc = body.location;
    if (!loc || typeof loc !== "object" || Array.isArray(loc)) {
      throw ApiError.badRequest("location must be a GeoJSON Point object.");
    }
    const g = loc as Record<string, unknown>;
    if (g.type !== "Point" || !Array.isArray(g.coordinates) || g.coordinates.length !== 2) {
      throw ApiError.badRequest("location must be { type: 'Point', coordinates: [longitude, latitude] }.");
    }
    lng = g.coordinates[0];
    lat = g.coordinates[1];
  } else {
    throw ApiError.badRequest("GPS coordinates are required.");
  }

  if (
    typeof lat !== "number" ||
    typeof lng !== "number" ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    throw ApiError.badRequest(
      "GPS coordinates must have finite latitude in [-90, 90] and longitude in [-180, 180]."
    );
  }

  return {
    type: "Point",
    coordinates: [lng, lat],
  };
}

function validateAccessibilityFeatures(value: unknown): IAccessibilityFeatures {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw ApiError.badRequest("accessibilityFeatures must be an object containing all 7 boolean attributes.");
  }

  const raw = value as Record<string, unknown>;
  const validated: Partial<IAccessibilityFeatures> = {};

  for (const key of FEATURE_KEYS) {
    if (typeof raw[key] !== "boolean") {
      throw ApiError.badRequest(`accessibilityFeatures.${key} must be a boolean.`);
    }
    validated[key] = raw[key] as boolean;
  }

  return validated as IAccessibilityFeatures;
}

function isValidPhotoRef(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed || trimmed.length > 2048) {
    return false;
  }
  if (trimmed.startsWith("/uploads/")) {
    return !trimmed.includes("..");
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function validatePhotos(value: unknown): string[] {
  if (value === undefined) {
    return [];
  }
  if (!Array.isArray(value)) {
    throw ApiError.badRequest("photos must be an array of valid image URLs or upload paths.");
  }
  if (value.length > 10) {
    throw ApiError.badRequest("A location cannot have more than 10 photos.");
  }

  const sanitized: string[] = [];
  for (const item of value) {
    if (typeof item !== "string" || !isValidPhotoRef(item)) {
      throw ApiError.badRequest("Each photo must be a valid http/https URL or /uploads/ path.");
    }
    sanitized.push(item.trim());
  }

  return sanitized;
}

export function validateObjectIdParam(id: unknown, label: string = "ID"): string {
  if (typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest(`Invalid ${label} format.`);
  }
  return id;
}

export function validateCreateLocationInput(data: unknown): ICreateLocationInput {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw ApiError.badRequest("Invalid request body: expected JSON object.");
  }

  const body = data as Record<string, unknown>;
  rejectProtectedFields(body);

  return {
    name: validateStringField(body.name, "Location name", 2, 150),
    description: validateStringField(body.description, "Location description", 10, 2000),
    address: validateStringField(body.address, "Address", 5, 300),
    location: validateCoordinates(body),
    category: validateCategory(body.category),
    accessibilityFeatures: validateAccessibilityFeatures(body.accessibilityFeatures),
    photos: validatePhotos(body.photos),
  };
}

export function validateUpdateLocationInput(data: unknown): IUpdateLocationInput {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw ApiError.badRequest("Invalid request body: expected JSON object.");
  }

  const body = data as Record<string, unknown>;
  rejectProtectedFields(body);

  const updates: IUpdateLocationInput = {};

  if ("name" in body && body.name !== undefined) {
    updates.name = validateStringField(body.name, "Location name", 2, 150);
  }
  if ("description" in body && body.description !== undefined) {
    updates.description = validateStringField(body.description, "Location description", 10, 2000);
  }
  if ("address" in body && body.address !== undefined) {
    updates.address = validateStringField(body.address, "Address", 5, 300);
  }
  if (
    ("coordinates" in body && body.coordinates !== undefined) ||
    ("location" in body && body.location !== undefined)
  ) {
    updates.location = validateCoordinates(body);
  }
  if ("category" in body && body.category !== undefined) {
    updates.category = validateCategory(body.category);
  }
  if ("accessibilityFeatures" in body && body.accessibilityFeatures !== undefined) {
    updates.accessibilityFeatures = validateAccessibilityFeatures(body.accessibilityFeatures);
  }
  if ("photos" in body && body.photos !== undefined) {
    updates.photos = validatePhotos(body.photos);
  }

  if (Object.keys(updates).length === 0) {
    throw ApiError.badRequest("At least one valid updatable field must be provided.");
  }

  return updates;
}

export function validateVerifyLocationInput(data: unknown): IVerifyLocationInput {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw ApiError.badRequest("Invalid request body: expected JSON object.");
  }

  const body = data as Record<string, unknown>;
  const status = body.status;

  if (status !== VerificationStatus.VERIFIED && status !== VerificationStatus.REJECTED) {
    throw ApiError.badRequest("Verification status must be either 'verified' or 'rejected'.");
  }

  let rejectionReason: string | undefined;
  if ("rejectionReason" in body && body.rejectionReason !== undefined) {
    if (typeof body.rejectionReason !== "string") {
      throw ApiError.badRequest("rejectionReason must be a string.");
    }
    const trimmed = body.rejectionReason.trim();
    if (trimmed.length > 500) {
      throw ApiError.badRequest("rejectionReason cannot exceed 500 characters.");
    }
    if (trimmed.length > 0) {
      rejectionReason = trimmed;
    }
  }

  if (status === VerificationStatus.REJECTED && !rejectionReason) {
    throw ApiError.badRequest("A rejectionReason is required when rejecting a location.");
  }

  return {
    status,
    ...(rejectionReason ? { rejectionReason } : {}),
  };
}

export function validateLocationQuery(query: unknown): ILocationQuery {
  const q = (query && typeof query === "object" ? query : {}) as Record<string, unknown>;

  const rawPage = q.page !== undefined ? Number(q.page) : 1;
  const rawLimit = q.limit !== undefined ? Number(q.limit) : 20;

  if (!Number.isInteger(rawPage) || rawPage < 1) {
    throw ApiError.badRequest("page must be an integer >= 1.");
  }
  if (!Number.isInteger(rawLimit) || rawLimit < 1 || rawLimit > 100) {
    throw ApiError.badRequest("limit must be an integer between 1 and 100.");
  }

  let search: string | undefined;
  if (typeof q.search === "string" && q.search.trim()) {
    search = q.search.trim().slice(0, 120);
  }

  let category: LocationCategoryType | undefined;
  if (q.category !== undefined && q.category !== "") {
    category = validateCategory(q.category);
  }

  let verificationStatus: VerificationStatusType | undefined;
  if (q.verificationStatus !== undefined && q.verificationStatus !== "") {
    if (
      typeof q.verificationStatus !== "string" ||
      !ALL_VERIFICATION_STATUSES.includes(q.verificationStatus as VerificationStatusType)
    ) {
      throw ApiError.badRequest("Invalid verificationStatus filter.");
    }
    verificationStatus = q.verificationStatus as VerificationStatusType;
  }

  let submittedBy: string | undefined;
  if (q.submittedBy !== undefined && q.submittedBy !== "") {
    submittedBy = validateObjectIdParam(q.submittedBy, "submittedBy");
  }

  let lat: number | undefined;
  let lng: number | undefined;
  if (q.lat !== undefined || q.lng !== undefined) {
    lat = Number(q.lat);
    lng = Number(q.lng);
    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      throw ApiError.badRequest("lat and lng must both be valid finite GPS coordinates.");
    }
  }

  const rawRadius = q.radiusKm !== undefined ? Number(q.radiusKm) : 10;
  if (!Number.isFinite(rawRadius) || rawRadius <= 0 || rawRadius > 200) {
    throw ApiError.badRequest("radiusKm must be a finite number between 0 and 200.");
  }

  const allowedSorts: readonly LocationSortField[] = [
    "createdAt",
    "accessibilityScore",
    "name",
    "distance",
  ];
  const sortBy: LocationSortField =
    typeof q.sortBy === "string" && allowedSorts.includes(q.sortBy as LocationSortField)
      ? (q.sortBy as LocationSortField)
      : lat !== undefined && lng !== undefined
        ? "distance"
        : "createdAt";

  if (sortBy === "distance" && (lat === undefined || lng === undefined)) {
    throw ApiError.badRequest("Sorting by distance requires lat and lng query parameters.");
  }

  const sortOrder: SortOrder =
    q.sortOrder === "asc"
      ? "asc"
      : q.sortOrder === "desc"
        ? "desc"
        : sortBy === "distance"
          ? "asc"
          : "desc";

  const features: Partial<IAccessibilityFeatures> = {};
  for (const key of FEATURE_KEYS) {
    if (q[key] !== undefined && q[key] !== "") {
      if (q[key] === "true" || q[key] === true) {
        features[key] = true;
      } else if (q[key] === "false" || q[key] === false) {
        features[key] = false;
      } else {
        throw ApiError.badRequest(`${key} filter must be 'true' or 'false'.`);
      }
    }
  }

  return {
    page: rawPage,
    limit: rawLimit,
    ...(search !== undefined ? { search } : {}),
    ...(category !== undefined ? { category } : {}),
    ...(verificationStatus !== undefined ? { verificationStatus } : {}),
    ...(submittedBy !== undefined ? { submittedBy } : {}),
    ...(lat !== undefined ? { lat } : {}),
    ...(lng !== undefined ? { lng } : {}),
    radiusKm: rawRadius,
    sortBy,
    sortOrder,
    features,
  };
}
