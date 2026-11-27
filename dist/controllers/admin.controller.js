"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listUsers = listUsers;
exports.updateUser = updateUser;
exports.analytics = analytics;
const admin_validation_js_1 = require("../validations/admin.validation.js");
const location_validation_js_1 = require("../validations/location.validation.js");
const admin_service_js_1 = require("../services/admin.service.js");
const apiResponse_js_1 = require("../utils/apiResponse.js");
const apiError_js_1 = require("../utils/apiError.js");
async function listUsers(req, res, next) {
    try {
        const query = (0, admin_validation_js_1.validateAdminUsersQuery)(req.query);
        const { items, meta } = await (0, admin_service_js_1.listUsersForAdmin)(query);
        (0, apiResponse_js_1.sendResponse)(res, 200, "Users retrieved successfully.", items, meta);
    }
    catch (error) {
        next(error);
    }
}
async function updateUser(req, res, next) {
    try {
        if (!req.user) {
            return next(apiError_js_1.ApiError.unauthorized("Authentication required."));
        }
        const id = (0, location_validation_js_1.validateObjectIdParam)(req.params.id, "user ID");
        const updates = (0, admin_validation_js_1.validateAdminUpdateUserInput)(req.body);
        const updated = await (0, admin_service_js_1.updateUserByAdmin)(id, updates, req.user);
        (0, apiResponse_js_1.sendResponse)(res, 200, "User updated successfully.", updated);
    }
    catch (error) {
        next(error);
    }
}
async function analytics(_req, res, next) {
    try {
        const data = await (0, admin_service_js_1.getPlatformAnalytics)();
        (0, apiResponse_js_1.sendResponse)(res, 200, "Platform analytics retrieved successfully.", data);
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=admin.controller.js.map