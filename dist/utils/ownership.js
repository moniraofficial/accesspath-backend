"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertResourceOwnership = assertResourceOwnership;
exports.assertCanModifyOwnPendingResource = assertCanModifyOwnPendingResource;
exports.assertCanModerateResource = assertCanModerateResource;
exports.hasPermission = hasPermission;
const roles_js_1 = require("../config/roles.js");
const apiError_js_1 = require("./apiError.js");
/**
 * Asserts that the authenticated user owns the resource, or possesses administrative authority.
 * Throws HTTP 403 if unauthorized.
 */
function assertResourceOwnership(resourceOwnerId, currentUser, resourceName = "resource") {
    // Admins possess authorized administrative override
    if (currentUser.role === roles_js_1.UserRole.ADMIN) {
        return;
    }
    const ownerIdStr = resourceOwnerId.toString();
    const currentUserIdStr = currentUser.id.toString();
    if (ownerIdStr !== currentUserIdStr) {
        throw apiError_js_1.ApiError.forbidden(`Access Denied: You do not have permission to modify or delete this ${resourceName}.`);
    }
}
/**
 * Asserts that the authenticated user owns a contribution and it is still in 'pending' status.
 * Contributors cannot directly modify resources once verified or rejected.
 */
function assertCanModifyOwnPendingResource(resourceOwnerId, resourceStatus, currentUser, resourceName = "submission") {
    if (currentUser.role === roles_js_1.UserRole.ADMIN) {
        return;
    }
    assertResourceOwnership(resourceOwnerId, currentUser, resourceName);
    if (resourceStatus !== "pending") {
        throw apiError_js_1.ApiError.forbidden(`Access Denied: You cannot modify a ${resourceName} that is already ${resourceStatus}.`);
    }
}
/**
 * Asserts that the user possesses a specific moderation permission AND enforces anti-self-approval.
 * Contributors and Moderators CANNOT verify, approve, or reject their own submissions.
 */
function assertCanModerateResource(moderator, resourceAuthorId, requiredPermission, resourceName = "submission") {
    const allowedPermissions = roles_js_1.ROLE_PERMISSIONS[moderator.role] || [];
    if (!allowedPermissions.includes(requiredPermission)) {
        throw apiError_js_1.ApiError.forbidden(`Access Denied: Insufficient permissions to moderate ${resourceName}.`);
    }
    // Anti-Self-Approval Enforcement (Section 6 Requirements)
    const authorIdStr = resourceAuthorId.toString();
    const moderatorIdStr = moderator.id.toString();
    if (authorIdStr === moderatorIdStr && moderator.role !== roles_js_1.UserRole.ADMIN) {
        throw apiError_js_1.ApiError.forbidden(`Conflict of Interest: You cannot verify, approve, or reject your own ${resourceName}.`);
    }
}
/**
 * Checks whether a given role holds a specific permission.
 */
function hasPermission(role, permission) {
    return (roles_js_1.ROLE_PERMISSIONS[role] || []).includes(permission);
}
//# sourceMappingURL=ownership.js.map