import {
  ALL_BARRIER_CATEGORIES,
  ALL_BARRIER_STATUSES,
  BarrierCategoryType,
  BarrierStatus,
  BarrierStatusType,
} from "../types/barrier.types.js";
import { IGeoPoint } from "../types/location.types.js";
import { ApiError } from "../utils/apiError.js";
import { validateObjectIdParam } from "./location.validation.js";

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

const PROTECTED_BARRIER_FIELDS = [
  "status",
  "reportedBy",
  "verifiedBy",
  "verifiedAt",
  "resolvedBy",
  "resolvedAt",
  "rejectionReason",
] as const;

function rejectProtectedFields(body: Record<string, unknown>): void {
  for (const field of PROTECTED_BARRIER_FIELDS) {
    if (field in body && body[field] !== undefined) {
      throw ApiError.badRequest(`Field "${field}" cannot be set directly by clients.`);
    }
  }
}

function validateCategory(value: unknown): BarrierCategoryType {
  if (
    typeof value !== "string" ||
    !ALL_BARRIER_CATEGORIES.includes(value as BarrierCategoryType)
  ) {
    throw ApiError.badRequest(
      `Invalid barrier category. Must be one of: ${ALL_BARRIER_CATEGORIES.join(", ")}.`
    );
  }
  return value as BarrierCategoryType;
}

function validateDescription(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) {
    throw ApiError.badRequest("Barrier description is required and must be a non-empty string.");
  }
  const trimmed = value.trim();
  if (trimmed.length < 10 || trimmed.length > 1500) {
    throw ApiError.badRequest("Barrier description must be between 10 and 1500 characters.");
  }
  return trimmed;
}

function validateImageUrl(value: unknown): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== "string" || !value.trim()) {
    throw ApiError.badRequest("imageUrl must be a non-empty string.");
  }
  const trimmed = value.trim();
  if (trimmed.length > 2048) {
    throw ApiError.badRequest("imageUrl cannot exceed 2048 characters.");
  }
  if (trimmed.startsWith("/uploads/")) {
    if (trimmed.includes("..")) {
      throw ApiError.badRequest("Invalid imageUrl path.");
    }
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error("Invalid protocol");
    }
    return trimmed;
  } catch {
    throw ApiError.badRequest("imageUrl must be a valid http/https URL or /uploads/ path.");
  }
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
    throw ApiError.badRequest("GPS location coordinates are required.");
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

  return { type: "Point", coordinates: [lng, lat] };
}

export function validateCreateBarrierInput(data: unknown): ICreateBarrierInput {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw ApiError.badRequest("Invalid request body: expected JSON object.");
  }

  const body = data as Record<string, unknown>;
  rejectProtectedFields(body);

  const imageUrl = validateImageUrl(body.imageUrl);

  return {
    category: validateCategory(body.category),
    description: validateDescription(body.description),
    location: validateCoordinates(body),
    ...(imageUrl !== undefined ? { imageUrl } : {}),
  };
}

export function validateUpdateBarrierInput(data: unknown): IUpdateBarrierInput {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw ApiError.badRequest("Invalid request body: expected JSON object.");
  }

  const body = data as Record<string, unknown>;
  rejectProtectedFields(body);

  const updates: IUpdateBarrierInput = {};
  if ("category" in body && body.category !== undefined) {
    updates.category = validateCategory(body.category);
  }
  if ("description" in body && body.description !== undefined) {
    updates.description = validateDescription(body.description);
  }
  if ("imageUrl" in body && body.imageUrl !== undefined) {
    const img = validateImageUrl(body.imageUrl);
    if (img !== undefined) {
      updates.imageUrl = img;
    }
  }
  if (
    ("coordinates" in body && body.coordinates !== undefined) ||
    ("location" in body && body.location !== undefined)
  ) {
    updates.location = validateCoordinates(body);
  }

  if (Object.keys(updates).length === 0) {
    throw ApiError.badRequest("At least one valid updatable field must be provided.");
  }

  return updates;
}

export function validateVerifyBarrierInput(data: unknown): IVerifyBarrierInput {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw ApiError.badRequest("Invalid request body: expected JSON object.");
  }

  const body = data as Record<string, unknown>;
  const status = body.status;

  if (
    status !== BarrierStatus.VERIFIED &&
    status !== BarrierStatus.REJECTED &&
    status !== BarrierStatus.RESOLVED
  ) {
    throw ApiError.badRequest(
      "Barrier status must be 'verified', 'rejected', or 'resolved'."
    );
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

  if (status === BarrierStatus.REJECTED && !rejectionReason) {
    throw ApiError.badRequest("A rejectionReason is required when rejecting a barrier report.");
  }

  return {
    status,
    ...(rejectionReason ? { rejectionReason } : {}),
  };
}

export function validateBarrierQuery(query: unknown): IBarrierQuery {
  const q = (query && typeof query === "object" ? query : {}) as Record<string, unknown>;

  const page = q.page !== undefined ? Number(q.page) : 1;
  const limit = q.limit !== undefined ? Number(q.limit) : 20;

  if (!Number.isInteger(page) || page < 1) {
    throw ApiError.badRequest("page must be an integer >= 1.");
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw ApiError.badRequest("limit must be an integer between 1 and 100.");
  }

  let search: string | undefined;
  if (typeof q.search === "string" && q.search.trim()) {
    search = q.search.trim().slice(0, 120);
  }

  let category: BarrierCategoryType | undefined;
  if (q.category !== undefined && q.category !== "") {
    category = validateCategory(q.category);
  }

  let status: BarrierStatusType | undefined;
  if (q.status !== undefined && q.status !== "") {
    if (
      typeof q.status !== "string" ||
      !ALL_BARRIER_STATUSES.includes(q.status as BarrierStatusType)
    ) {
      throw ApiError.badRequest("Invalid barrier status filter.");
    }
    status = q.status as BarrierStatusType;
  }

  let reportedBy: string | undefined;
  if (q.reportedBy !== undefined && q.reportedBy !== "") {
    reportedBy = validateObjectIdParam(q.reportedBy, "reportedBy");
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

  const radiusKm = q.radiusKm !== undefined ? Number(q.radiusKm) : 10;
  if (!Number.isFinite(radiusKm) || radiusKm <= 0 || radiusKm > 200) {
    throw ApiError.badRequest("radiusKm must be a finite number between 0 and 200.");
  }

  const sortBy: "createdAt" | "distance" =
    q.sortBy === "distance"
      ? "distance"
      : q.sortBy === "createdAt"
        ? "createdAt"
        : lat !== undefined && lng !== undefined
          ? "distance"
          : "createdAt";

  if (sortBy === "distance" && (lat === undefined || lng === undefined)) {
    throw ApiError.badRequest("Sorting by distance requires lat and lng query parameters.");
  }

  const sortOrder: "asc" | "desc" =
    q.sortOrder === "asc"
      ? "asc"
      : q.sortOrder === "desc"
        ? "desc"
        : sortBy === "distance"
          ? "asc"
          : "desc";

  return {
    page,
    limit,
    ...(search !== undefined ? { search } : {}),
    ...(category !== undefined ? { category } : {}),
    ...(status !== undefined ? { status } : {}),
    ...(reportedBy !== undefined ? { reportedBy } : {}),
    ...(lat !== undefined ? { lat } : {}),
    ...(lng !== undefined ? { lng } : {}),
    radiusKm,
    sortBy,
    sortOrder,
  };
}
