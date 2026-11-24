"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = require("mongoose");
const roles_js_1 = require("../config/roles.js");
const userSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, "Name is required"],
        trim: true,
        minlength: [2, "Name must be at least 2 characters"],
        maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
        index: true,
    },
    password: {
        type: String,
        required: [true, "Password hash is required"],
        minlength: [8, "Password must be at least 8 characters"],
        select: false, // Prevents password hash from being selected by default
    },
    role: {
        type: String,
        enum: {
            values: roles_js_1.ALL_ROLES,
            message: "Invalid role: {VALUE}. Must be admin, moderator, contributor, or regular",
        },
        default: roles_js_1.UserRole.REGULAR, // Enforces default regular role for new public users
        index: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    tokenVersion: {
        type: Number,
        default: 0, // For instantaneous token revocation & logout handling
    },
}, {
    timestamps: true,
    toJSON: {
        transform(_doc, ret) {
            delete ret.password;
            delete ret.__v;
            if (ret._id) {
                ret.id = ret._id.toString();
                delete ret._id;
            }
            return ret;
        },
    },
    toObject: {
        transform(_doc, ret) {
            delete ret.password;
            delete ret.__v;
            if (ret._id) {
                ret.id = ret._id.toString();
                delete ret._id;
            }
            return ret;
        },
    },
});
// Indexes
userSchema.index({ role: 1, isActive: 1 });
exports.User = (0, mongoose_1.model)("User", userSchema);
//# sourceMappingURL=user.model.js.map