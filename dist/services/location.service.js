"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateAccessibilityScore = calculateAccessibilityScore;
exports.toLocationResponse = toLocationResponse;
exports.createLocation = createLocation;
exports.listLocations = listLocations;
exports.getLocationById = getLocationById;
exports.updateLocation = updateLocation;
exports.deleteLocation = deleteLocation;
exports.verifyLocation = verifyLocation;
const mongoose_1 = __importDefault(require("mongoose"));
const location_model_js_1 = require("../models/location.model.js");
const roles_js_1 = require("../config/roles.js");
const location_types_js_1 = require("../types/location.types.js");
const ownership_js_1 = require("../utils/ownership.js");
const apiError_js_1 = require("../utils/apiError.js");
const FEATURE_WEIGHTS = {
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
function calculateAccessibilityScore(features) {
    let score = 0;
    for (const [key, weight] of Object.entries(FEATURE_WEIGHTS)) {
        if (features[key]) {
            score += weight;
        }
    }
    return score;
}
function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function toLocationResponse(doc) {
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
        isVerified: doc.verificationStatus === location_types_js_1.VerificationStatus.VERIFIED,
        ...(doc.rejectionReason !== undefined ? { rejectionReason: doc.rejectionReason } : {}),
        submittedBy: doc.submittedBy.toString(),
        ...(doc.verifiedBy !== undefined ? { verifiedBy: doc.verifiedBy.toString() } : {}),
        ...(doc.verifiedAt !== undefined ? { verifiedAt: doc.verifiedAt } : {}),
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
    };
}
async function createLocation(input, currentUser) {
    const canCreate = (0, ownership_js_1.hasPermission)(currentUser.role, roles_js_1.Permissions.SUBMIT_LOCATIONS) ||
        (0, ownership_js_1.hasPermission)(currentUser.role, roles_js_1.Permissions.MANAGE_LOCATIONS);
    if (!canCreate) {
        throw apiError_js_1.ApiError.forbidden("Access Denied: You do not have permission to submit locations.");
    }
    const accessibilityScore = calculateAccessibilityScore(input.accessibilityFeatures);
    // Security: all newly created locations start as 'pending' regardless of caller role
    const created = await location_model_js_1.Location.create({
        name: input.name,
        description: input.description,
        address: input.address,
        location: input.location,
        category: input.category,
        accessibilityScore,
        accessibilityFeatures: input.accessibilityFeatures,
        photos: input.photos,
        verificationStatus: location_types_js_1.VerificationStatus.PENDING,
        submittedBy: new mongoose_1.default.Types.ObjectId(currentUser.id),
    });
    return toLocationResponse(created);
}
async function listLocations(query) {
    const filter = {};
    if (query.category) {
        filter.category = query.category;
    }
    if (query.verificationStatus) {
        filter.verificationStatus = query.verificationStatus;
    }
    if (query.submittedBy) {
        filter.submittedBy = new mongoose_1.default.Types.ObjectId(query.submittedBy);
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
    const sortDirection = query.sortOrder === "asc" ? 1 : -1;
    if (query.lat !== undefined && query.lng !== undefined) {
        const pipeline = [
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
        }
        else if (sortDirection === -1) {
            pipeline.push({ $sort: { distanceMeters: -1, _id: 1 } });
        }
        pipeline.push({
            $facet: {
                items: [{ $skip: skip }, { $limit: query.limit }],
                totalCount: [{ $count: "count" }],
            },
        });
        const [aggResult] = await location_model_js_1.Location.aggregate(pipeline);
        const rawItems = (aggResult?.items ?? []);
        const totalRecords = aggResult?.totalCount?.[0]?.count ?? 0;
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
    const sortSpec = {
        [query.sortBy === "distance" ? "createdAt" : query.sortBy]: sortDirection,
        _id: 1,
    };
    const [docs, totalRecords] = await Promise.all([
        location_model_js_1.Location.find(filter).sort(sortSpec).skip(skip).limit(query.limit).lean(),
        location_model_js_1.Location.countDocuments(filter),
    ]);
    const totalPages = Math.max(1, Math.ceil(totalRecords / query.limit));
    return {
        items: docs.map((d) => toLocationResponse(d)),
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
async function getLocationById(locationId) {
    const location = await location_model_js_1.Location.findById(locationId).lean();
    if (!location) {
        throw apiError_js_1.ApiError.notFound("Location not found.");
    }
    return toLocationResponse(location);
}
async function updateLocation(locationId, updates, currentUser) {
    const location = await location_model_js_1.Location.findById(locationId);
    if (!location) {
        throw apiError_js_1.ApiError.notFound("Location not found.");
    }
    if (!(0, ownership_js_1.hasPermission)(currentUser.role, roles_js_1.Permissions.MANAGE_LOCATIONS)) {
        (0, ownership_js_1.assertCanModifyOwnPendingResource)(location.submittedBy, location.verificationStatus, currentUser, "location");
    }
    if (updates.name !== undefined)
        location.name = updates.name;
    if (updates.description !== undefined)
        location.description = updates.description;
    if (updates.address !== undefined)
        location.address = updates.address;
    if (updates.location !== undefined)
        location.location = updates.location;
    if (updates.category !== undefined)
        location.category = updates.category;
    if (updates.photos !== undefined)
        location.photos = updates.photos;
    if (updates.accessibilityFeatures !== undefined) {
        location.accessibilityFeatures = updates.accessibilityFeatures;
        location.accessibilityScore = calculateAccessibilityScore(updates.accessibilityFeatures);
    }
    const saved = await location.save();
    return toLocationResponse(saved);
}
async function deleteLocation(locationId, currentUser) {
    const location = await location_model_js_1.Location.findById(locationId);
    if (!location) {
        throw apiError_js_1.ApiError.notFound("Location not found.");
    }
    if (!(0, ownership_js_1.hasPermission)(currentUser.role, roles_js_1.Permissions.MANAGE_LOCATIONS)) {
        (0, ownership_js_1.assertCanModifyOwnPendingResource)(location.submittedBy, location.verificationStatus, currentUser, "location");
    }
    await location.deleteOne();
    return { id: locationId };
}
async function verifyLocation(locationId, input, currentUser) {
    const location = await location_model_js_1.Location.findById(locationId);
    if (!location) {
        throw apiError_js_1.ApiError.notFound("Location not found.");
    }
    (0, ownership_js_1.assertCanModerateResource)(currentUser, location.submittedBy, roles_js_1.Permissions.VERIFY_LOCATIONS, "location");
    location.verificationStatus = input.status;
    location.verifiedBy = new mongoose_1.default.Types.ObjectId(currentUser.id);
    location.verifiedAt = new Date();
    if (input.status === location_types_js_1.VerificationStatus.REJECTED && input.rejectionReason) {
        location.rejectionReason = input.rejectionReason;
    }
    else {
        location.set("rejectionReason", undefined);
    }
    const saved = await location.save();
    return toLocationResponse(saved);
}
//# sourceMappingURL=location.service.js.map