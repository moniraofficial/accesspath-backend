"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addFavorite = addFavorite;
exports.removeFavorite = removeFavorite;
exports.listFavorites = listFavorites;
const mongoose_1 = __importDefault(require("mongoose"));
const favorite_model_js_1 = require("../models/favorite.model.js");
const location_model_js_1 = require("../models/location.model.js");
const roles_js_1 = require("../config/roles.js");
const ownership_js_1 = require("../utils/ownership.js");
const apiError_js_1 = require("../utils/apiError.js");
const location_service_js_1 = require("./location.service.js");
async function addFavorite(locationId, currentUser) {
    if (!(0, ownership_js_1.hasPermission)(currentUser.role, roles_js_1.Permissions.MANAGE_FAVORITES)) {
        throw apiError_js_1.ApiError.forbidden("Access Denied: You do not have permission to manage favorites.");
    }
    const locationExists = await location_model_js_1.Location.exists({ _id: locationId });
    if (!locationExists) {
        throw apiError_js_1.ApiError.notFound("Location not found.");
    }
    const userObjectId = new mongoose_1.default.Types.ObjectId(currentUser.id);
    const locationObjectId = new mongoose_1.default.Types.ObjectId(locationId);
    const favorite = await favorite_model_js_1.Favorite.findOneAndUpdate({ userId: userObjectId, locationId: locationObjectId }, { $setOnInsert: { userId: userObjectId, locationId: locationObjectId } }, { upsert: true, returnDocument: "after" });
    if (!favorite) {
        throw apiError_js_1.ApiError.internal("Failed to save favorite location.");
    }
    return {
        id: favorite._id.toString(),
        userId: favorite.userId.toString(),
        locationId: favorite.locationId.toString(),
        createdAt: favorite.createdAt,
    };
}
async function removeFavorite(locationId, currentUser) {
    if (!(0, ownership_js_1.hasPermission)(currentUser.role, roles_js_1.Permissions.MANAGE_FAVORITES)) {
        throw apiError_js_1.ApiError.forbidden("Access Denied: You do not have permission to manage favorites.");
    }
    const deleted = await favorite_model_js_1.Favorite.findOneAndDelete({
        userId: new mongoose_1.default.Types.ObjectId(currentUser.id),
        locationId: new mongoose_1.default.Types.ObjectId(locationId),
    });
    if (!deleted) {
        throw apiError_js_1.ApiError.notFound("Location is not in your favorites.");
    }
    return { locationId };
}
async function listFavorites(currentUser, page, limit) {
    if (!(0, ownership_js_1.hasPermission)(currentUser.role, roles_js_1.Permissions.MANAGE_FAVORITES)) {
        throw apiError_js_1.ApiError.forbidden("Access Denied: You do not have permission to view favorites.");
    }
    const filter = { userId: new mongoose_1.default.Types.ObjectId(currentUser.id) };
    const skip = (page - 1) * limit;
    const [docs, totalRecords] = await Promise.all([
        favorite_model_js_1.Favorite.find(filter)
            .sort({ createdAt: -1, _id: 1 })
            .skip(skip)
            .limit(limit)
            .populate("locationId")
            .lean(),
        favorite_model_js_1.Favorite.countDocuments(filter),
    ]);
    const items = [];
    for (const doc of docs) {
        const populatedLoc = doc.locationId;
        if (populatedLoc && populatedLoc._id) {
            items.push({
                favoriteId: doc._id.toString(),
                savedAt: doc.createdAt,
                location: (0, location_service_js_1.toLocationResponse)(populatedLoc),
            });
        }
    }
    const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
    return {
        items,
        meta: {
            page,
            limit,
            totalRecords,
            totalPages,
            hasNextPage: page < totalPages && totalRecords > 0,
            hasPrevPage: page > 1,
        },
    };
}
//# sourceMappingURL=favorite.service.js.map