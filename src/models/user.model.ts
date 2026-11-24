import { Schema, model, Model } from "mongoose";
import { ALL_ROLES, UserRole } from "../config/roles.js";
import { IUserDocument } from "../types/user.types.js";

const userSchema = new Schema<IUserDocument>(
  {
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
        values: ALL_ROLES,
        message: "Invalid role: {VALUE}. Must be admin, moderator, contributor, or regular",
      },
      default: UserRole.REGULAR, // Enforces default regular role for new public users
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
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
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
      transform(_doc, ret: Record<string, any>) {
        delete ret.password;
        delete ret.__v;
        if (ret._id) {
          ret.id = ret._id.toString();
          delete ret._id;
        }
        return ret;
      },
    },
  }
);

// Indexes
userSchema.index({ role: 1, isActive: 1 });

export const User: Model<IUserDocument> = model<IUserDocument>("User", userSchema);
