"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRoles = authorizeRoles;
exports.authorizePermissions = authorizePermissions;
const ownership_js_1 = require("../utils/ownership.js");
const apiError_js_1 = require("../utils/apiError.js");
/**
 * Role-Based Access Control (RBAC) middleware.
 * Requires req.user to be populated by `authenticate` and to hold one of `allowedRoles`.
 * Resource ownership checks are intentionally kept separate in `src/utils/ownership.ts`.
 */
function authorizeRoles(...allowedRoles) {
    if (allowedRoles.length === 0) {
        throw new Error("authorizeRoles requires at least one allowed role.");
    }
    return (req, _res, next) => {
        if (!req.user) {
            return next(apiError_js_1.ApiError.unauthorized("Authentication required."));
        }
        if (!allowedRoles.includes(req.user.role)) {
            return next(apiError_js_1.ApiError.forbidden("Access Denied: You do not have the required role for this action."));
        }
        return next();
    };
}
/**
 * Permission-Based Access Control middleware.
 * Requires req.user to be populated by `authenticate` and for their role to grant
 * every permission in `requiredPermissions` via ROLE_PERMISSIONS.
 * Resource ownership checks are intentionally kept separate in `src/utils/ownership.ts`.
 */
function authorizePermissions(...requiredPermissions) {
    if (requiredPermissions.length === 0) {
        throw new Error("authorizePermissions requires at least one required permission.");
    }
    return (req, _res, next) => {
        const currentUser = req.user;
        if (!currentUser) {
            return next(apiError_js_1.ApiError.unauthorized("Authentication required."));
        }
        const hasAllPermissions = requiredPermissions.every((permission) => (0, ownership_js_1.hasPermission)(currentUser.role, permission));
        if (!hasAllPermissions) {
            return next(apiError_js_1.ApiError.forbidden("Access Denied: You do not have the required permissions for this action."));
        }
        return next();
    };
}
//# sourceMappingURL=rbac.middleware.js.map