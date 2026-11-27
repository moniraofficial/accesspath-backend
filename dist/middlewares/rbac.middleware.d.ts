import type { Request, Response, NextFunction } from "express";
import { UserRoleType, PermissionType } from "../config/roles.js";
/**
 * Role-Based Access Control (RBAC) middleware.
 * Requires req.user to be populated by `authenticate` and to hold one of `allowedRoles`.
 * Resource ownership checks are intentionally kept separate in `src/utils/ownership.ts`.
 */
export declare function authorizeRoles(...allowedRoles: UserRoleType[]): (req: Request, _res: Response, next: NextFunction) => void;
/**
 * Permission-Based Access Control middleware.
 * Requires req.user to be populated by `authenticate` and for their role to grant
 * every permission in `requiredPermissions` via ROLE_PERMISSIONS.
 * Resource ownership checks are intentionally kept separate in `src/utils/ownership.ts`.
 */
export declare function authorizePermissions(...requiredPermissions: PermissionType[]): (req: Request, _res: Response, next: NextFunction) => void;
//# sourceMappingURL=rbac.middleware.d.ts.map