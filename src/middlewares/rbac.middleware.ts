import type { Request, Response, NextFunction } from "express";
import { UserRoleType, PermissionType } from "../config/roles.js";
import { hasPermission } from "../utils/ownership.js";
import { ApiError } from "../utils/apiError.js";

/**
 * Role-Based Access Control (RBAC) middleware.
 * Requires req.user to be populated by `authenticate` and to hold one of `allowedRoles`.
 * Resource ownership checks are intentionally kept separate in `src/utils/ownership.ts`.
 */
export function authorizeRoles(...allowedRoles: UserRoleType[]) {
  if (allowedRoles.length === 0) {
    throw new Error("authorizeRoles requires at least one allowed role.");
  }

  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(ApiError.unauthorized("Authentication required."));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden("Access Denied: You do not have the required role for this action.")
      );
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
export function authorizePermissions(...requiredPermissions: PermissionType[]) {
  if (requiredPermissions.length === 0) {
    throw new Error("authorizePermissions requires at least one required permission.");
  }

  return (req: Request, _res: Response, next: NextFunction): void => {
    const currentUser = req.user;
    if (!currentUser) {
      return next(ApiError.unauthorized("Authentication required."));
    }

    const hasAllPermissions = requiredPermissions.every((permission) =>
      hasPermission(currentUser.role, permission)
    );

    if (!hasAllPermissions) {
      return next(
        ApiError.forbidden("Access Denied: You do not have the required permissions for this action.")
      );
    }

    return next();
  };
}
