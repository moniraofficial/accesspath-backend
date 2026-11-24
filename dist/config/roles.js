"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE_PERMISSIONS = exports.Permissions = exports.ROLE_HIERARCHY = exports.ALL_ROLES = exports.UserRole = void 0;
exports.UserRole = {
    ADMIN: "admin",
    MODERATOR: "moderator",
    CONTRIBUTOR: "contributor",
    REGULAR: "regular",
};
exports.ALL_ROLES = [
    exports.UserRole.ADMIN,
    exports.UserRole.MODERATOR,
    exports.UserRole.CONTRIBUTOR,
    exports.UserRole.REGULAR,
];
exports.ROLE_HIERARCHY = {
    [exports.UserRole.ADMIN]: 4,
    [exports.UserRole.MODERATOR]: 3,
    [exports.UserRole.CONTRIBUTOR]: 2,
    [exports.UserRole.REGULAR]: 1,
};
exports.Permissions = {
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
};
exports.ROLE_PERMISSIONS = {
    [exports.UserRole.ADMIN]: [
        exports.Permissions.MANAGE_USERS,
        exports.Permissions.MANAGE_CATEGORIES,
        exports.Permissions.MANAGE_LOCATIONS,
        exports.Permissions.MANAGE_ACCESSIBILITY_DATA,
        exports.Permissions.MANAGE_BARRIERS,
        exports.Permissions.VIEW_ANALYTICS,
        exports.Permissions.CONFIGURE_SYSTEM,
        exports.Permissions.VERIFY_LOCATIONS,
        exports.Permissions.VERIFY_BARRIERS,
    ],
    [exports.UserRole.MODERATOR]: [
        exports.Permissions.VERIFY_LOCATIONS,
        exports.Permissions.VERIFY_BARRIERS,
        exports.Permissions.MANAGE_LOCATIONS,
        exports.Permissions.MANAGE_BARRIERS,
        exports.Permissions.MODERATE_FEEDBACK,
        exports.Permissions.SEARCH_LOCATIONS,
    ],
    [exports.UserRole.CONTRIBUTOR]: [
        exports.Permissions.SUBMIT_LOCATIONS,
        exports.Permissions.UPDATE_LOCATIONS,
        exports.Permissions.REPORT_BARRIERS,
        exports.Permissions.TRACK_CONTRIBUTIONS,
        exports.Permissions.SEARCH_LOCATIONS,
    ],
    [exports.UserRole.REGULAR]: [
        exports.Permissions.SEARCH_LOCATIONS,
        exports.Permissions.REPORT_BARRIERS,
        exports.Permissions.SUBMIT_FEEDBACK,
        exports.Permissions.MANAGE_FAVORITES,
    ],
};
//# sourceMappingURL=roles.js.map