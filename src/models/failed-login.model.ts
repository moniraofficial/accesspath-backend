import { Schema, model, Model } from "mongoose";
import { IFailedLoginDocument } from "../types/failed-login.types.js";

const failedLoginSchema = new Schema<IFailedLoginDocument>(
  {
    key: {
      type: String,
      required: [true, "Key is required"],
      unique: true,
      trim: true,
    },
    attempts: {
      type: Number,
      required: [true, "Attempts is required"],
      default: 0,
      min: [0, "Attempts cannot be negative"],
    },
    expiresAt: {
      type: Date,
      required: [true, "Expiration date is required"],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
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

// TTL index on expiresAt (automatically removes expired counter records)
failedLoginSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const FailedLogin: Model<IFailedLoginDocument> = model<IFailedLoginDocument>(
  "FailedLogin",
  failedLoginSchema
);
