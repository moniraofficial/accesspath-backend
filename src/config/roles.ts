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
  // Administrative & Governance
  MANAGE_USERS: "manage_users",
  MANAGE_CATEGORIES: "manage_categories",
  MANAGE_ACCESSIBILITY_DATA: "manage_accessibility_data",
  VIEW_ANALYTICS: "view_analytics",
  CONFIGURE_SYSTEM: "configure_system",

  // Verification & Moderation (Section 6 compliant)
  VERIFY_LOCATIONS: "verify_locations",
  VERIFY_BARRIERS: "verify_barriers",
  MANAGE_LOCATIONS: "manage_locations",
  MANAGE_BARRIERS: "manage_barriers",
  MODERATE_FEEDBACK: "moderate_feedback",

  // Community Contribution
  SUBMIT_LOCATIONS: "submit_locations",
  UPDATE_LOCATIONS: "update_locations",
  TRACK_CONTRIBUTIONS: "track_contributions",

  // Consumer Mobility
  SEARCH_LOCATIONS: "search_locations",
  REPORT_BARRIERS: "report_barriers",
  SUBMIT_FEEDBACK: "submit_feedback",
  MANAGE_FAVORITES: "manage_favorites",
} as const;

export type PermissionType = (typeof Permissions)[keyof typeof Permissions];

export const ROLE_PERMISSIONS: Record<UserRoleType, readonly PermissionType[]> = {
  [UserRole.ADMIN]: [
    Permissions.MANAGE_USERS,
    Permissions.MANAGE_CATEGORIES,
    Permissions.MANAGE_LOCATIONS,
    Permissions.MANAGE_ACCESSIBILITY_DATA,
    Permissions.MANAGE_BARRIERS,
    Permissions.VIEW_ANALYTICS,
    Permissions.CONFIGURE_SYSTEM,
    Permissions.VERIFY_LOCATIONS,
    Permissions.VERIFY_BARRIERS,
  ],
  [UserRole.MODERATOR]: [
    Permissions.VERIFY_LOCATIONS,
    Permissions.VERIFY_BARRIERS,
    Permissions.MANAGE_LOCATIONS,
    Permissions.MANAGE_BARRIERS,
    Permissions.MODERATE_FEEDBACK,
    Permissions.SEARCH_LOCATIONS,
  ],
  [UserRole.CONTRIBUTOR]: [
    Permissions.SUBMIT_LOCATIONS,
    Permissions.UPDATE_LOCATIONS,
    Permissions.REPORT_BARRIERS,
    Permissions.TRACK_CONTRIBUTIONS,
    Permissions.SEARCH_LOCATIONS,
  ],
  [UserRole.REGULAR]: [
    Permissions.SEARCH_LOCATIONS,
    Permissions.REPORT_BARRIERS,
    Permissions.SUBMIT_FEEDBACK,
    Permissions.MANAGE_FAVORITES,
  ],
};
