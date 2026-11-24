import { Types, Document } from "mongoose";
import { UserRoleType } from "../config/roles.js";
export interface IUser {
    name: string;
    email: string;
    password?: string;
    role: UserRoleType;
    isActive: boolean;
    tokenVersion: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface IUserDocument extends Omit<IUser, "password">, Document {
    _id: Types.ObjectId;
    password?: string;
}
export interface IUserResponse {
    id: string;
    name: string;
    email: string;
    role: UserRoleType;
    isActive: boolean;
    tokenVersion: number;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=user.types.d.ts.map