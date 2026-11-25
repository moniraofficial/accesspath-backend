import { UserRoleType, PermissionType } from "../config/roles.js";
import { IAuthUser } from "../types/index.js";
/**
 * Asserts that the authenticated user owns the resource, or possesses administrative authority.
 * Throws HTTP 403 if unauthorized.
 */
export declare function assertResourceOwnership(resourceOwnerId: string | {
    toString(): string;
}, currentUser: IAuthUser, resourceName?: string): void;
/**
 * Asserts that the authenticated user owns a contribution and it is still in 'pending' status.
 * Contributors cannot directly modify resources once verified or rejected.
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