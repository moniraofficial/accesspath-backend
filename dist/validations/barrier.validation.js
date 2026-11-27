"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCreateBarrierInput = validateCreateBarrierInput;
exports.validateUpdateBarrierInput = validateUpdateBarrierInput;
exports.validateVerifyBarrierInput = validateVerifyBarrierInput;
exports.validateBarrierQuery = validateBarrierQuery;
const barrier_types_js_1 = require("../types/barrier.types.js");
const apiError_js_1 = require("../utils/apiError.js");
const location_validation_js_1 = require("./location.validation.js");
const PROTECTED_BARRIER_FIELDS = [
    "status",
    "reportedBy",
    "verifiedBy",
    "verifiedAt",
    "resolvedBy",
    "resolvedAt",
    "rejectionReason",
];
function rejectProtectedFields(body) {
    for (const field of PROTECTED_BARRIER_FIELDS) {
        if (field in body && body[field] !== undefined) {
            throw apiError_js_1.ApiError.badRequest(`Field "${field}" cannot be set directly by clients.`);
        }
    }
}
function validateCategory(value) {
    if (typeof value !== "string" ||
        !barrier_types_js_1.ALL_BARRIER_CATEGORIES.includes(value)) {
        throw apiError_js_1.ApiError.badRequest(`Invalid barrier category. Must be one of: ${barrier_types_js_1.ALL_BARRIER_CATEGORIES.join(", ")}.`);
    }
    return value;
}
function validateDescription(value) {
    if (typeof value !== "string" || !value.trim()) {
        throw apiError_js_1.ApiError.badRequest("Barrier description is required and must be a non-empty string.");
    }
    const trimmed = value.trim();
    if (trimmed.length < 10 || trimmed.length > 1500) {
        throw apiError_js_1.ApiError.badRequest("Barrier description must be between 10 and 1500 characters.");
    }
    return trimmed;
}
function validateImageUrl(value) {
    if (value === undefined) {
        return undefined;
    }
    if (typeof value !== "string" || !value.trim()) {
        throw apiError_js_1.ApiError.badRequest("imageUrl must be a non-empty string.");
    }
    const trimmed = value.trim();
    if (trimmed.length > 2048) {
        throw apiError_js_1.ApiError.badRequest("imageUrl cannot exceed 2048 characters.");
    }
    if (trimmed.startsWith("/uploads/")) {
        if (trimmed.includes("..")) {
            throw apiError_js_1.ApiError.badRequest("Invalid imageUrl path.");
        }
        return trimmed;
    }
    try {
        const parsed = new URL(trimmed);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
            throw new Error("Invalid protocol");
        }
        return trimmed;
    }
    catch {
        throw apiError_js_1.ApiError.badRequest("imageUrl must be a valid http/https URL or /uploads/ path.");
    }
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
        throw apiError_js_1.ApiError.badRequest("GPS location coordinates are required.");
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
    return { type: "Point", coordinates: [lng, lat] };
}
function validateCreateBarrierInput(data) {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw apiError_js_1.ApiError.badRequest("Invalid request body: expected JSON object.");
    }
    const body = data;
    rejectProtectedFields(body);
    const imageUrl = validateImageUrl(body.imageUrl);
    return {
        category: validateCategory(body.category),
        description: validateDescription(body.description),
        location: validateCoordinates(body),
        ...(imageUrl !== undefined ? { imageUrl } : {}),
    };
}
function validateUpdateBarrierInput(data) {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw apiError_js_1.ApiError.badRequest("Invalid request body: expected JSON object.");
    }
    const body = data;
    rejectProtectedFields(body);
    const updates = {};
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
    if (("coordinates" in body && body.coordinates !== undefined) ||
        ("location" in body && body.location !== undefined)) {
        updates.location = validateCoordinates(body);
    }
    if (Object.keys(updates).length === 0) {
        throw apiError_js_1.ApiError.badRequest("At least one valid updatable field must be provided.");
    }
    return updates;
}
function validateVerifyBarrierInput(data) {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw apiError_js_1.ApiError.badRequest("Invalid request body: expected JSON object.");
    }
    const body = data;
    const status = body.status;
    if (status !== barrier_types_js_1.BarrierStatus.VERIFIED &&
        status !== barrier_types_js_1.BarrierStatus.REJECTED &&
        status !== barrier_types_js_1.BarrierStatus.RESOLVED) {
        throw apiError_js_1.ApiError.badRequest("Barrier status must be 'verified', 'rejected', or 'resolved'.");
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
    if (status === barrier_types_js_1.BarrierStatus.REJECTED && !rejectionReason) {
        throw apiError_js_1.ApiError.badRequest("A rejectionReason is required when rejecting a barrier report.");
    }
    return {
        status,
        ...(rejectionReason ? { rejectionReason } : {}),
    };
}
function validateBarrierQuery(query) {
    const q = (query && typeof query === "object" ? query : {});
    const page = q.page !== undefined ? Number(q.page) : 1;
    const limit = q.limit !== undefined ? Number(q.limit) : 20;
    if (!Number.isInteger(page) || page < 1) {
        throw apiError_js_1.ApiError.badRequest("page must be an integer >= 1.");
    }
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
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
    let status;
    if (q.status !== undefined && q.status !== "") {
        if (typeof q.status !== "string" ||
            !barrier_types_js_1.ALL_BARRIER_STATUSES.includes(q.status)) {
            throw apiError_js_1.ApiError.badRequest("Invalid barrier status filter.");
        }
        status = q.status;
    }
    let reportedBy;
    if (q.reportedBy !== undefined && q.reportedBy !== "") {
        reportedBy = (0, location_validation_js_1.validateObjectIdParam)(q.reportedBy, "reportedBy");
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
    const radiusKm = q.radiusKm !== undefined ? Number(q.radiusKm) : 10;
    if (!Number.isFinite(radiusKm) || radiusKm <= 0 || radiusKm > 200) {
        throw apiError_js_1.ApiError.badRequest("radiusKm must be a finite number between 0 and 200.");
    }
    const sortBy = q.sortBy === "distance"
        ? "distance"
        : q.sortBy === "createdAt"
            ? "createdAt"
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
//# sourceMappingURL=barrier.validation.js.map