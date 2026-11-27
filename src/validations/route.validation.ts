import { IRoutePoint, IRoutePreferences } from "../types/route.types.js";
import { ApiError } from "../utils/apiError.js";

export interface IDiscoverRoutesInput {
  start: IRoutePoint;
  destination: IRoutePoint;
  preferences: IRoutePreferences;
}

function validateRoutePoint(value: unknown, label: string): IRoutePoint {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw ApiError.badRequest(`${label} must be an object with latitude and longitude.`);
  }
  const obj = value as Record<string, unknown>;
  const lat = obj.latitude;
  const lng = obj.longitude;

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
      `${label} must contain finite latitude in [-90, 90] and longitude in [-180, 180].`
    );
  }

  return { latitude: lat, longitude: lng };
}

export function validateDiscoverRoutesInput(data: unknown): IDiscoverRoutesInput {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw ApiError.badRequest("Invalid request body: expected JSON object.");
  }

  const body = data as Record<string, unknown>;
  const start = validateRoutePoint(body.start, "start");
  const destination = validateRoutePoint(body.destination, "destination");

  const preferences: IRoutePreferences = {};
  if (body.preferences !== undefined) {
    if (!body.preferences || typeof body.preferences !== "object" || Array.isArray(body.preferences)) {
      throw ApiError.badRequest("preferences must be an object.");
    }
    const p = body.preferences as Record<string, unknown>;
    for (const key of [
      "wheelchairFriendly",
      "requireRamp",
      "requireElevator",
      "avoidUnverified",
    ] as const) {
      if (p[key] !== undefined) {
        if (typeof p[key] !== "boolean") {
          throw ApiError.badRequest(`preferences.${key} must be a boolean.`);
        }
        preferences[key] = p[key] as boolean;
      }
    }
  }

  return { start, destination, preferences };
}
