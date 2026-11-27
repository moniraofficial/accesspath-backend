"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.add = add;
exports.remove = remove;
exports.list = list;
const feedback_validation_js_1 = require("../validations/feedback.validation.js");
const location_validation_js_1 = require("../validations/location.validation.js");
const favorite_service_js_1 = require("../services/favorite.service.js");
const apiResponse_js_1 = require("../utils/apiResponse.js");
const apiError_js_1 = require("../utils/apiError.js");
async function add(req, res, next) {
    try {
        if (!req.user) {
            return next(apiError_js_1.ApiError.unauthorized("Authentication required."));
        }
        const locationId = (0, location_validation_js_1.validateObjectIdParam)(req.params.locationId, "location ID");
        const favorite = await (0, favorite_service_js_1.addFavorite)(locationId, req.user);
        (0, apiResponse_js_1.sendResponse)(res, 201, "Location added to favorites.", favorite);
    }
    catch (error) {
        next(error);
    }
}
async function remove(req, res, next) {
    try {
        if (!req.user) {
            return next(apiError_js_1.ApiError.unauthorized("Authentication required."));
        }
        const locationId = (0, location_validation_js_1.validateObjectIdParam)(req.params.locationId, "location ID");
        const result = await (0, favorite_service_js_1.removeFavorite)(locationId, req.user);
        (0, apiResponse_js_1.sendResponse)(res, 200, "Location removed from favorites.", result);
    }
    catch (error) {
        next(error);
    }
}
async function list(req, res, next) {
    try {
        if (!req.user) {
            return next(apiError_js_1.ApiError.unauthorized("Authentication required."));
        }
        const { page, limit } = (0, feedback_validation_js_1.validatePaginationParams)(req.query);
        const { items, meta } = await (0, favorite_service_js_1.listFavorites)(req.user, page, limit);
        (0, apiResponse_js_1.sendResponse)(res, 200, "Favorite locations retrieved successfully.", items, meta);
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=favorite.controller.js.map