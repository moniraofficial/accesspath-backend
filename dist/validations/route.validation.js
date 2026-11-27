"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateDiscoverRoutesInput = validateDiscoverRoutesInput;
const apiError_js_1 = require("../utils/apiError.js");
function validateRoutePoint(value, label) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw apiError_js_1.ApiError.badRequest(`${label} must be an object with latitude and longitude.`);
    }
    const obj = value;
    const lat = obj.latitude;
    const lng = obj.longitude;
    if (typeof lat !== "number" ||
        typeof lng !== "number" ||
        !Number.isFinite(lat) ||
        !Number.isFinite(lng) ||
        lat < -90 ||
        lat > 90 ||
        lng < -180 ||
        lng > 180) {
        throw apiError_js_1.ApiError.badRequest(`${label} must contain finite latitude in [-90, 90] and longitude in [-180, 180].`);
    }
    return { latitude: lat, longitude: lng };
}
function validateDiscoverRoutesInput(data) {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw apiError_js_1.ApiError.badRequest("Invalid request body: expected JSON object.");
    }
    const body = data;
    const start = validateRoutePoint(body.start, "start");
    const destination = validateRoutePoint(body.destination, "destination");
    const preferences = {};
    if (body.preferences !== undefined) {
        if (!body.preferences || typeof body.preferences !== "object" || Array.isArray(body.preferences)) {
            throw apiError_js_1.ApiError.badRequest("preferences must be an object.");
        }
        const p = body.preferences;
        for (const key of [
            "wheelchairFriendly",
            "requireRamp",
            "requireElevator",
            "avoidUnverified",
        ]) {
            if (p[key] !== undefined) {
                if (typeof p[key] !== "boolean") {
                    throw apiError_js_1.ApiError.badRequest(`preferences.${key} must be a boolean.`);
                }
                preferences[key] = p[key];
            }
        }
    }
    return { start, destination, preferences };
}
//# sourceMappingURL=route.validation.js.map