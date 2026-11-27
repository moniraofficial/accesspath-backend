import { UserRoleType } from "../config/roles.js";
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
export declare function validateAdminUsersQuery(query: unknown): IAdminUsersQuery;
export declare function validateAdminUpdateUserInput(data: unknown): IAdminUpdateUserInput;
//# sourceMappingURL=admin.validation.d.ts.map