import { ALL_ROLES, UserRoleType } from "../config/roles.js";
import { ApiError } from "../utils/apiError.js";
import { validatePaginationParams } from "./feedback.validation.js";

export interface IAdminUsersQuery {
  page: number;
  limit: number;
  role?: UserRoleType;
  isActive?: boolean;
  search?: string;
}

export interface IAdminUpdateUserInput {
  role?: UserRoleType;
  isActive?: boolean;
}

export function validateAdminUsersQuery(query: unknown): IAdminUsersQuery {
  const q = (query && typeof query === "object" ? query : {}) as Record<string, unknown>;
  const { page, limit } = validatePaginationParams(q);

  let role: UserRoleType | undefined;
  if (q.role !== undefined && q.role !== "") {
    if (typeof q.role !== "string" || !ALL_ROLES.includes(q.role as UserRoleType)) {
      throw ApiError.badRequest("Invalid role filter.");
    }
    role = q.role as UserRoleType;
  }

  let isActive: boolean | undefined;
  if (q.isActive !== undefined && q.isActive !== "") {
    if (q.isActive === "true" || q.isActive === true) {
      isActive = true;
    } else if (q.isActive === "false" || q.isActive === false) {
      isActive = false;
    } else {
      throw ApiError.badRequest("isActive filter must be 'true' or 'false'.");
    }
  }

  let search: string | undefined;
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

export function validateAdminUpdateUserInput(data: unknown): IAdminUpdateUserInput {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw ApiError.badRequest("Invalid request body: expected JSON object.");
  }

  const body = data as Record<string, unknown>;
  const updates: IAdminUpdateUserInput = {};

  if ("role" in body && body.role !== undefined) {
    if (typeof body.role !== "string" || !ALL_ROLES.includes(body.role as UserRoleType)) {
      throw ApiError.badRequest(`Invalid role. Must be one of: ${ALL_ROLES.join(", ")}.`);
    }
    updates.role = body.role as UserRoleType;
  }

  if ("isActive" in body && body.isActive !== undefined) {
    if (typeof body.isActive !== "boolean") {
      throw ApiError.badRequest("isActive must be a boolean.");
    }
    updates.isActive = body.isActive;
  }

  if (Object.keys(updates).length === 0) {
    throw ApiError.badRequest("At least one updatable field (role or isActive) is required.");
  }

  return updates;
}
