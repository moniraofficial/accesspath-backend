import { UserRoleType, PermissionType } from "../config/roles.js";
import { IAuthUser } from "../types/index.js";
/**
 * Asserts that the authenticated user is the resource owner.
 * Does NOT grant Admins an automatic bypass — use assertOwnershipOrAdmin when
 * an admin override is explicitly appropriate for the operation.
 * Throws HTTP 403 if the caller is not the owner.
 */
export declare function assertResourceOwnership(resourceOwnerId: string | {
    toString(): string;
}, currentUser: IAuthUser, resourceName?: string): void;
/**
 * Asserts that the authenticated user either owns the resource OR holds the Admin role.
 * This helper is intentionally named to make admin-override intent explicit at the call site.
 * Use this only where admin access to any user's resource has been deliberately authorized
 * (e.g. admin user-management routes, not general content routes).
 * Throws HTTP 403 if neither condition is satisfied.
 */
export declare function assertOwnershipOrAdmin(resourceOwnerId: string | {
    toString(): string;
}, currentUser: IAuthUser, resourceName?: string): void;
/**
 * Asserts that the authenticated user owns a contribution and it is still in 'pending' status.
 * Uses pure ownership check (no implicit admin bypass) — admins must use moderation routes,
 * not author routes, to modify any submission.
 * Throws HTTP 403 if the caller is not the owner or if the resource is no longer pending.
 */
export declare function assertCanModifyOwnPendingResource(resourceOwnerId: string | {
    toString(): string;
}, resourceStatus: string, currentUser: IAuthUser, resourceName?: string): void;
/**
 * Asserts that the user possesses a specific moderation permission AND enforces anti-self-approval.
 * Contributors and Moderators CANNOT verify, approve, or reject their own submissions.
 */
export declare function assertCanModerateResource(moderator: IAuthUser, resourceAuthorId: string | {
    toString(): string;
}, requiredPermission: PermissionType, resourceName?: string): void;
/**
 * Checks whether a given role holds a specific permission.
 */
export declare function hasPermission(role: UserRoleType, permission: PermissionType): boolean;
//# sourceMappingURL=ownership.d.ts.map