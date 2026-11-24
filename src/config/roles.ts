export const UserRole = {
  ADMIN: "admin",
  MODERATOR: "moderator",
  CONTRIBUTOR: "contributor",
  REGULAR: "regular",
} as const;

export type UserRoleType = (typeof UserRole)[keyof typeof UserRole];

export const ALL_ROLES: readonly UserRoleType[] = [
  UserRole.ADMIN,
  UserRole.MODERATOR,
  UserRole.CONTRIBUTOR,
  UserRole.REGULAR,
] as const;

export const ROLE_HIERARCHY: Record<UserRoleType, number> = {
  [UserRole.ADMIN]: 4,
  [UserRole.MODERATOR]: 3,
  [UserRole.CONTRIBUTOR]: 2,
  [UserRole.REGULAR]: 1,
};

export const Permissions = {
  // User Management
  MANAGE_USERS: "manage_users",
  // Locations
  SEARCH_LOCATIONS: "search_locations",
  SUBMIT_LOCATIONS: "submit_locations",
  VERIFY_LOCATIONS: "verify_locations",
  MANAGE_LOCATIONS: "manage_locations",
  // Barriers
  REPORT_BARRIERS: "report_barriers",
  VERIFY_BARRIERS: "verify_barriers",
  MANAGE_BARRIERS: "manage_barriers",
  // Reviews & Feedback
  SUBMIT_FEEDBACK: "submit_feedback",
  MODERATE_FEEDBACK: "moderate_feedback",
  // Favorites
  MANAGE_FAVORITES: "manage_favorites",
  // Analytics & System
  VIEW_ANALYTICS: "view_analytics",
  CONFIGURE_SYSTEM: "configure_system",
} as const;

export type PermissionType = (typeof Permissions)[keyof typeof Permissions];

export const ROLE_PERMISSIONS: Record<UserRoleType, readonly PermissionType[]> = {
  [UserRole.ADMIN]: [
    Permissions.MANAGE_USERS,
    Permissions.SEARCH_LOCATIONS,
    Permissions.SUBMIT_LOCATIONS,
    Permissions.VERIFY_LOCATIONS,
    Permissions.MANAGE_LOCATIONS,
    Permissions.REPORT_BARRIERS,
    Permissions.VERIFY_BARRIERS,
    Permissions.MANAGE_BARRIERS,
    Permissions.SUBMIT_FEEDBACK,
    Permissions.MODERATE_FEEDBACK,
    Permissions.MANAGE_FAVORITES,
    Permissions.VIEW_ANALYTICS,
    Permissions.CONFIGURE_SYSTEM,
  ],
  [UserRole.MODERATOR]: [
    Permissions.SEARCH_LOCATIONS,
    Permissions.VERIFY_LOCATIONS,
    Permissions.MANAGE_LOCATIONS,
    Permissions.REPORT_BARRIERS,
    Permissions.VERIFY_BARRIERS,
    Permissions.MANAGE_BARRIERS,
    Permissions.SUBMIT_FEEDBACK,
    Permissions.MODERATE_FEEDBACK,
    Permissions.MANAGE_FAVORITES,
  ],
  [UserRole.CONTRIBUTOR]: [
    Permissions.SEARCH_LOCATIONS,
    Permissions.SUBMIT_LOCATIONS,
    Permissions.REPORT_BARRIERS,
    Permissions.SUBMIT_FEEDBACK,
    Permissions.MANAGE_FAVORITES,
  ],
  [UserRole.REGULAR]: [
    Permissions.SEARCH_LOCATIONS,
    Permissions.REPORT_BARRIERS,
    Permissions.SUBMIT_FEEDBACK,
    Permissions.MANAGE_FAVORITES,
  ],
};
