"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateObjectIdParam = validateObjectIdParam;
exports.validateCreateLocationInput = validateCreateLocationInput;
exports.validateUpdateLocationInput = validateUpdateLocationInput;
exports.validateVerifyLocationInput = validateVerifyLocationInput;
exports.validateLocationQuery = validateLocationQuery;
const mongoose_1 = __importDefault(require("mongoose"));
const location_types_js_1 = require("../types/location.types.js");
const apiError_js_1 = require("../utils/apiError.js");
const FEATURE_KEYS = [
    "wheelchairAccess",
    "rampAvailability",
    "elevatorAvailability",
    "accessibleRestroom",
    "accessibleParking",
    "stairFreeEntry",
    "doorAccessibility",
];
const PROTECTED_LOCATION_FIELDS = [
    "verificationStatus",
    "verifiedBy",
    "verifiedAt",
    "submittedBy",
    "accessibilityScore",
    "rejectionReason",
];
function rejectProtectedFields(body) {
    for (const field of PROTECTED_LOCATION_FIELDS) {
        if (field in body && body[field] !== undefined) {
            throw apiError_js_1.ApiError.badRequest(`Field "${field}" cannot be set directly by clients.`);
        }
    }
}
function validateStringField(value, fieldName, min, max) {
    if (typeof value !== "string" || !value.trim()) {
        throw apiError_js_1.ApiError.badRequest(`${fieldName} is required and must be a non-empty string.`);
    }
    const trimmed = value.trim();
    if (trimmed.length < min || trimmed.length > max) {
        throw apiError_js_1.ApiError.badRequest(`${fieldName} must be between ${min} and ${max} characters.`);
    }
    return trimmed;
}
function validateCategory(value) {
    if (typeof value !== "string" ||
        !location_types_js_1.ALL_LOCATION_CATEGORIES.includes(value)) {
        throw apiError_js_1.ApiError.badRequest(`Invalid category. Must be one of: ${location_types_js_1.ALL_LOCATION_CATEGORIES.join(", ")}.`);
    }
    return value;
}
function validateCoordinates(body) {
    let lat;
    let lng;
    if ("coordinates" in body && body.coordinates !== undefined) {
        const coords = body.coordinates;
        if (!coords || typeof coords !== "object" || Array.isArray(coords)) {
            throw apiError_js_1.ApiError.badRequest("coordinates must be an object with latitude and longitude.");
        }
        const c = coords;
        lat = c.latitude;
        lng = c.longitude;
    }
    else if ("location" in body && body.location !== undefined) {
        const loc = body.location;
        if (!loc || typeof loc !== "object" || Array.isArray(loc)) {
            throw apiError_js_1.ApiError.badRequest("location must be a GeoJSON Point object.");
        }
        const g = loc;
        if (g.type !== "Point" || !Array.isArray(g.coordinates) || g.coordinates.length !== 2) {
            throw apiError_js_1.ApiError.badRequest("location must be { type: 'Point', coordinates: [longitude, latitude] }.");
        }
        lng = g.coordinates[0];
        lat = g.coordinates[1];
    }
    else {
        throw apiError_js_1.ApiError.badRequest("GPS coordinates are required.");
    }
    if (typeof lat !== "number" ||
        typeof lng !== "number" ||
        !Number.isFinite(lat) ||
        !Number.isFinite(lng) ||
        lat < -90 ||
        lat > 90 ||
        lng < -180 ||
        lng > 180) {
        throw apiError_js_1.ApiError.badRequest("GPS coordinates must have finite latitude in [-90, 90] and longitude in [-180, 180].");
    }
    return {
        type: "Point",
        coordinates: [lng, lat],
    };
}
function validateAccessibilityFeatures(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw apiError_js_1.ApiError.badRequest("accessibilityFeatures must be an object containing all 7 boolean attributes.");
    }
    const raw = value;
    const validated = {};
    for (const key of FEATURE_KEYS) {
        if (typeof raw[key] !== "boolean") {
            throw apiError_js_1.ApiError.badRequest(`accessibilityFeatures.${key} must be a boolean.`);
        }
        validated[key] = raw[key];
    }
    return validated;
}
function isValidPhotoRef(url) {
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
    }
    catch {
        return false;
    }
}
function validatePhotos(value) {
    if (value === undefined) {
        return [];
    }
    if (!Array.isArray(value)) {
        throw apiError_js_1.ApiError.badRequest("photos must be an array of valid image URLs or upload paths.");
    }
    if (value.length > 10) {
        throw apiError_js_1.ApiError.badRequest("A location cannot have more than 10 photos.");
    }
    const sanitized = [];
    for (const item of value) {
        if (typeof item !== "string" || !isValidPhotoRef(item)) {
            throw apiError_js_1.ApiError.badRequest("Each photo must be a valid http/https URL or /uploads/ path.");
        }
        sanitized.push(item.trim());
    }
    return sanitized;
}
function validateObjectIdParam(id, label = "ID") {
    if (typeof id !== "string" || !mongoose_1.default.Types.ObjectId.isValid(id)) {
        throw apiError_js_1.ApiError.badRequest(`Invalid ${label} format.`);
    }
    return id;
}
function validateCreateLocationInput(data) {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw apiError_js_1.ApiError.badRequest("Invalid request body: expected JSON object.");
    }
    const body = data;
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
function validateUpdateLocationInput(data) {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw apiError_js_1.ApiError.badRequest("Invalid request body: expected JSON object.");
    }
    const body = data;
    rejectProtectedFields(body);
    const updates = {};
    if ("name" in body && body.name !== undefined) {
        updates.name = validateStringField(body.name, "Location name", 2, 150);
    }
    if ("description" in body && body.description !== undefined) {
        updates.description = validateStringField(body.description, "Location description", 10, 2000);
    }
    if ("address" in body && body.address !== undefined) {
        updates.address = validateStringField(body.address, "Address", 5, 300);
    }
    if (("coordinates" in body && body.coordinates !== undefined) ||
        ("location" in body && body.location !== undefined)) {
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
        throw apiError_js_1.ApiError.badRequest("At least one valid updatable field must be provided.");
    }
    return updates;
}
function validateVerifyLocationInput(data) {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw apiError_js_1.ApiError.badRequest("Invalid request body: expected JSON object.");
    }
    const body = data;
    const status = body.status;
    if (status !== location_types_js_1.VerificationStatus.VERIFIED && status !== location_types_js_1.VerificationStatus.REJECTED) {
        throw apiError_js_1.ApiError.badRequest("Verification status must be either 'verified' or 'rejected'.");
    }
    let rejectionReason;
    if ("rejectionReason" in body && body.rejectionReason !== undefined) {
        if (typeof body.rejectionReason !== "string") {
            throw apiError_js_1.ApiError.badRequest("rejectionReason must be a string.");
        }
        const trimmed = body.rejectionReason.trim();
        if (trimmed.length > 500) {
            throw apiError_js_1.ApiError.badRequest("rejectionReason cannot exceed 500 characters.");
        }
        if (trimmed.length > 0) {
            rejectionReason = trimmed;
        }
    }
    if (status === location_types_js_1.VerificationStatus.REJECTED && !rejectionReason) {
        throw apiError_js_1.ApiError.badRequest("A rejectionReason is required when rejecting a location.");
    }
    return {
        status,
        ...(rejectionReason ? { rejectionReason } : {}),
    };
}
function validateLocationQuery(query) {
    const q = (query && typeof query === "object" ? query : {});
    const rawPage = q.page !== undefined ? Number(q.page) : 1;
    const rawLimit = q.limit !== undefined ? Number(q.limit) : 20;
    if (!Number.isInteger(rawPage) || rawPage < 1) {
        throw apiError_js_1.ApiError.badRequest("page must be an integer >= 1.");
    }
    if (!Number.isInteger(rawLimit) || rawLimit < 1 || rawLimit > 100) {
        throw apiError_js_1.ApiError.badRequest("limit must be an integer between 1 and 100.");
    }
    let search;
    if (typeof q.search === "string" && q.search.trim()) {
        search = q.search.trim().slice(0, 120);
    }
    let category;
    if (q.category !== undefined && q.category !== "") {
        category = validateCategory(q.category);
    }
    let verificationStatus;
    if (q.verificationStatus !== undefined && q.verificationStatus !== "") {
        if (typeof q.verificationStatus !== "string" ||
            !location_types_js_1.ALL_VERIFICATION_STATUSES.includes(q.verificationStatus)) {
            throw apiError_js_1.ApiError.badRequest("Invalid verificationStatus filter.");
        }
        verificationStatus = q.verificationStatus;
    }
    let submittedBy;
    if (q.submittedBy !== undefined && q.submittedBy !== "") {
        submittedBy = validateObjectIdParam(q.submittedBy, "submittedBy");
    }
    let lat;
    let lng;
    if (q.lat !== undefined || q.lng !== undefined) {
        lat = Number(q.lat);
        lng = Number(q.lng);
        if (!Number.isFinite(lat) ||
            !Number.isFinite(lng) ||
            lat < -90 ||
            lat > 90 ||
            lng < -180 ||
            lng > 180) {
            throw apiError_js_1.ApiError.badRequest("lat and lng must both be valid finite GPS coordinates.");
        }
    }
    const rawRadius = q.radiusKm !== undefined ? Number(q.radiusKm) : 10;
    if (!Number.isFinite(rawRadius) || rawRadius <= 0 || rawRadius > 200) {
        throw apiError_js_1.ApiError.badRequest("radiusKm must be a finite number between 0 and 200.");
    }
    const allowedSorts = [
        "createdAt",
        "accessibilityScore",
        "name",
        "distance",
    ];
    const sortBy = typeof q.sortBy === "string" && allowedSorts.includes(q.sortBy)
        ? q.sortBy
        : lat !== undefined && lng !== undefined
            ? "distance"
            : "createdAt";
    if (sortBy === "distance" && (lat === undefined || lng === undefined)) {
        throw apiError_js_1.ApiError.badRequest("Sorting by distance requires lat and lng query parameters.");
    }
    const sortOrder = q.sortOrder === "asc"
        ? "asc"
        : q.sortOrder === "desc"
            ? "desc"
            : sortBy === "distance"
                ? "asc"
                : "desc";
    const features = {};
    for (const key of FEATURE_KEYS) {
        if (q[key] !== undefined && q[key] !== "") {
            if (q[key] === "true" || q[key] === true) {
                features[key] = true;
            }
            else if (q[key] === "false" || q[key] === false) {
                features[key] = false;
            }
            else {
                throw apiError_js_1.ApiError.badRequest(`${key} filter must be 'true' or 'false'.`);
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
//# sourceMappingURL=location.validation.js.map