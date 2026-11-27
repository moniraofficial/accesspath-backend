"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAdminUsersQuery = validateAdminUsersQuery;
exports.validateAdminUpdateUserInput = validateAdminUpdateUserInput;
const roles_js_1 = require("../config/roles.js");
const apiError_js_1 = require("../utils/apiError.js");
const feedback_validation_js_1 = require("./feedback.validation.js");
function validateAdminUsersQuery(query) {
    const q = (query && typeof query === "object" ? query : {});
    const { page, limit } = (0, feedback_validation_js_1.validatePaginationParams)(q);
    let role;
    if (q.role !== undefined && q.role !== "") {
        if (typeof q.role !== "string" || !roles_js_1.ALL_ROLES.includes(q.role)) {
            throw apiError_js_1.ApiError.badRequest("Invalid role filter.");
        }
        role = q.role;
    }
    let isActive;
    if (q.isActive !== undefined && q.isActive !== "") {
        if (q.isActive === "true" || q.isActive === true) {
            isActive = true;
        }
        else if (q.isActive === "false" || q.isActive === false) {
            isActive = false;
        }
        else {
            throw apiError_js_1.ApiError.badRequest("isActive filter must be 'true' or 'false'.");
        }
    }
    let search;
    if (typeof q.search === "string" && q.search.trim()) {
        search = q.search.trim().slice(0, 100);
    }
    return {
        page,
        limit,
        ...(role !== undefined ? { role } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
        ...(search !== undefined ? { search } : {}),
    };
}
function validateAdminUpdateUserInput(data) {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw apiError_js_1.ApiError.badRequest("Invalid request body: expected JSON object.");
    }
    const body = data;
    const updates = {};
    if ("role" in body && body.role !== undefined) {
        if (typeof body.role !== "string" || !roles_js_1.ALL_ROLES.includes(body.role)) {
            throw apiError_js_1.ApiError.badRequest(`Invalid role. Must be one of: ${roles_js_1.ALL_ROLES.join(", ")}.`);
        }
        updates.role = body.role;
    }
    if ("isActive" in body && body.isActive !== undefined) {
        if (typeof body.isActive !== "boolean") {
            throw apiError_js_1.ApiError.badRequest("isActive must be a boolean.");
        }
        updates.isActive = body.isActive;
    }
    if (Object.keys(updates).length === 0) {
        throw apiError_js_1.ApiError.badRequest("At least one updatable field (role or isActive) is required.");
    }
    return updates;
}
//# sourceMappingURL=admin.validation.js.map