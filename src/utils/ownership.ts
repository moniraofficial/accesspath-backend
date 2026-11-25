import { UserRole, UserRoleType, PermissionType, ROLE_PERMISSIONS } from "../config/roles.js";
import { IAuthUser } from "../types/index.js";
import { ApiError } from "./apiError.js";

/**
 * Asserts that the authenticated user owns the resource, or possesses administrative authority.
 * Throws HTTP 403 if unauthorized.
 */
export function assertResourceOwnership(
  resourceOwnerId: string | { toString(): string },
  currentUser: IAuthUser,
  resourceName: string = "resource"
): void {
  // Admins possess authorized administrative override
  if (currentUser.role === UserRole.ADMIN) {
    return;
  }

  const ownerIdStr = resourceOwnerId.toString();
  const currentUserIdStr = currentUser.id.toString();

  if (ownerIdStr !== currentUserIdStr) {
    throw ApiError.forbidden(`Access Denied: You do not have permission to modify or delete this ${resourceName}.`);
  }
}

/**
 * Asserts that the authenticated user owns a contribution and it is still in 'pending' status.
 * Contributors cannot directly modify resources once verified or rejected.
 */
export function assertCanModifyOwnPendingResource(
  resourceOwnerId: string | { toString(): string },
  resourceStatus: string,
  currentUser: IAuthUser,
  resourceName: string = "submission"
): void {
  if (currentUser.role === UserRole.ADMIN) {
    return;
  }

  assertResourceOwnership(resourceOwnerId, currentUser, resourceName);

  if (resourceStatus !== "pending") {
    throw ApiError.forbidden(`Access Denied: You cannot modify a ${resourceName} that is already ${resourceStatus}.`);
  }
}

/**
 * Asserts that the user possesses a specific moderation permission AND enforces anti-self-approval.
 * Contributors and Moderators CANNOT verify, approve, or reject their own submissions.
 */
export function assertCanModerateResource(
  moderator: IAuthUser,
  resourceAuthorId: string | { toString(): string },
  requiredPermission: PermissionType,
  resourceName: string = "submission"
): void {
  const allowedPermissions = ROLE_PERMISSIONS[moderator.role] || [];

  if (!allowedPermissions.includes(requiredPermission)) {
    throw ApiError.forbidden(`Access Denied: Insufficient permissions to moderate ${resourceName}.`);
  }

  // Anti-Self-Approval Enforcement (Section 6 Requirements)
  const authorIdStr = resourceAuthorId.toString();
  const moderatorIdStr = moderator.id.toString();

  if (authorIdStr === moderatorIdStr && moderator.role !== UserRole.ADMIN) {
    throw ApiError.forbidden(`Conflict of Interest: You cannot verify, approve, or reject your own ${resourceName}.`);
  }
}

/**
 * Checks whether a given role holds a specific permission.
 */
export function hasPermission(role: UserRoleType, permission: PermissionType): boolean {
  return (ROLE_PERMISSIONS[role] || []).includes(permission);
}
