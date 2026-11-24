export declare const UserRole: {
    readonly ADMIN: "admin";
    readonly MODERATOR: "moderator";
    readonly CONTRIBUTOR: "contributor";
    readonly REGULAR: "regular";
};
export type UserRoleType = (typeof UserRole)[keyof typeof UserRole];
export declare const ALL_ROLES: readonly UserRoleType[];
export declare const ROLE_HIERARCHY: Record<UserRoleType, number>;
export declare const Permissions: {
    readonly MANAGE_USERS: "manage_users";
    readonly SEARCH_LOCATIONS: "search_locations";
    readonly SUBMIT_LOCATIONS: "submit_locations";
    readonly VERIFY_LOCATIONS: "verify_locations";
    readonly MANAGE_LOCATIONS: "manage_locations";
    readonly REPORT_BARRIERS: "report_barriers";
    readonly VERIFY_BARRIERS: "verify_barriers";
    readonly MANAGE_BARRIERS: "manage_barriers";
    readonly SUBMIT_FEEDBACK: "submit_feedback";
    readonly MODERATE_FEEDBACK: "moderate_feedback";
    readonly MANAGE_FAVORITES: "manage_favorites";
    readonly VIEW_ANALYTICS: "view_analytics";
    readonly CONFIGURE_SYSTEM: "configure_system";
};
export type PermissionType = (typeof Permissions)[keyof typeof Permissions];
export declare const ROLE_PERMISSIONS: Record<UserRoleType, readonly PermissionType[]>;
//# sourceMappingURL=roles.d.ts.map