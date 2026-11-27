"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = create;
exports.list = list;
exports.getById = getById;
exports.update = update;
exports.remove = remove;
exports.verify = verify;
const location_validation_js_1 = require("../validations/location.validation.js");
const location_service_js_1 = require("../services/location.service.js");
const apiResponse_js_1 = require("../utils/apiResponse.js");
const apiError_js_1 = require("../utils/apiError.js");
async function create(req, res, next) {
    try {
        if (!req.user) {
            return next(apiError_js_1.ApiError.unauthorized("Authentication required."));
        }
        const input = (0, location_validation_js_1.validateCreateLocationInput)(req.body);
        const created = await (0, location_service_js_1.createLocation)(input, req.user);
        (0, apiResponse_js_1.sendResponse)(res, 201, "Location submitted successfully.", created);
    }
    catch (error) {
        next(error);
    }
}
async function list(req, res, next) {
    try {
        const query = (0, location_validation_js_1.validateLocationQuery)(req.query);
        const { items, meta } = await (0, location_service_js_1.listLocations)(query);
        (0, apiResponse_js_1.sendResponse)(res, 200, "Locations retrieved successfully.", items, meta);
    }
    catch (error) {
        next(error);
    }
}
async function getById(req, res, next) {
    try {
        const id = (0, location_validation_js_1.validateObjectIdParam)(req.params.id, "location ID");
        const location = await (0, location_service_js_1.getLocationById)(id);
        (0, apiResponse_js_1.sendResponse)(res, 200, "Location details retrieved successfully.", location);
    }
    catch (error) {
        next(error);
    }
}
async function update(req, res, next) {
    try {
        if (!req.user) {
            return next(apiError_js_1.ApiError.unauthorized("Authentication required."));
        }
        const id = (0, location_validation_js_1.validateObjectIdParam)(req.params.id, "location ID");
        const updates = (0, location_validation_js_1.validateUpdateLocationInput)(req.body);
        const updated = await (0, location_service_js_1.updateLocation)(id, updates, req.user);
        (0, apiResponse_js_1.sendResponse)(res, 200, "Location updated successfully.", updated);
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
        const id = (0, location_validation_js_1.validateObjectIdParam)(req.params.id, "location ID");
        const deleted = await (0, location_service_js_1.deleteLocation)(id, req.user);
        (0, apiResponse_js_1.sendResponse)(res, 200, "Location deleted successfully.", deleted);
    }
    catch (error) {
        next(error);
    }
}
async function verify(req, res, next) {
    try {
        if (!req.user) {
            return next(apiError_js_1.ApiError.unauthorized("Authentication required."));
        }
        const id = (0, location_validation_js_1.validateObjectIdParam)(req.params.id, "location ID");
        const input = (0, location_validation_js_1.validateVerifyLocationInput)(req.body);
        const verified = await (0, location_service_js_1.verifyLocation)(id, input, req.user);
        (0, apiResponse_js_1.sendResponse)(res, 200, `Location ${input.status} successfully.`, verified);
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=location.controller.js.map