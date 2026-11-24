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
};
exports.ROLE_PERMISSIONS = {
    [exports.UserRole.ADMIN]: [
        exports.Permissions.MANAGE_USERS,
        exports.Permissions.SEARCH_LOCATIONS,
        exports.Permissions.SUBMIT_LOCATIONS,
        exports.Permissions.VERIFY_LOCATIONS,
        exports.Permissions.MANAGE_LOCATIONS,
        exports.Permissions.REPORT_BARRIERS,
        exports.Permissions.VERIFY_BARRIERS,
        exports.Permissions.MANAGE_BARRIERS,
        exports.Permissions.SUBMIT_FEEDBACK,
        exports.Permissions.MODERATE_FEEDBACK,
        exports.Permissions.MANAGE_FAVORITES,
        exports.Permissions.VIEW_ANALYTICS,
        exports.Permissions.CONFIGURE_SYSTEM,
    ],
    [exports.UserRole.MODERATOR]: [
        exports.Permissions.SEARCH_LOCATIONS,
        exports.Permissions.VERIFY_LOCATIONS,
        exports.Permissions.MANAGE_LOCATIONS,
        exports.Permissions.REPORT_BARRIERS,
        exports.Permissions.VERIFY_BARRIERS,
        exports.Permissions.MANAGE_BARRIERS,
        exports.Permissions.SUBMIT_FEEDBACK,
        exports.Permissions.MODERATE_FEEDBACK,
        exports.Permissions.MANAGE_FAVORITES,
    ],
    [exports.UserRole.CONTRIBUTOR]: [
        exports.Permissions.SEARCH_LOCATIONS,
        exports.Permissions.SUBMIT_LOCATIONS,
        exports.Permissions.REPORT_BARRIERS,
        exports.Permissions.SUBMIT_FEEDBACK,
        exports.Permissions.MANAGE_FAVORITES,
    ],
    [exports.UserRole.REGULAR]: [
        exports.Permissions.SEARCH_LOCATIONS,
        exports.Permissions.REPORT_BARRIERS,
        exports.Permissions.SUBMIT_FEEDBACK,
        exports.Permissions.MANAGE_FAVORITES,
    ],
};
//# sourceMappingURL=roles.js.map