import { Schema, model, Model } from "mongoose";
import {
  ALL_LOCATION_CATEGORIES,
  ALL_VERIFICATION_STATUSES,
  ILocationDocument,
  VerificationStatus,
} from "../types/location.types.js";

const accessibilityFeaturesSchema = new Schema(
  {
    wheelchairAccess: { type: Boolean, required: true, default: false },
    rampAvailability: { type: Boolean, required: true, default: false },
    elevatorAvailability: { type: Boolean, required: true, default: false },
    accessibleRestroom: { type: Boolean, required: true, default: false },
    accessibleParking: { type: Boolean, required: true, default: false },
    stairFreeEntry: { type: Boolean, required: true, default: false },
    doorAccessibility: { type: Boolean, required: true, default: false },
  },
  { _id: false }
);

const geoPointSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["Point"],
      required: true,
      default: "Point",
    },
    coordinates: {
      type: [Number],
      required: [true, "GPS coordinates [longitude, latitude] are required"],
      validate: {
        validator(coords: number[]) {
          if (!Array.isArray(coords) || coords.length !== 2) {
            return false;
          }
          const [lng, lat] = coords;
          return (
            typeof lng === "number" &&
            typeof lat === "number" &&
            Number.isFinite(lng) &&
            Number.isFinite(lat) &&
            lng >= -180 &&
            lng <= 180 &&
            lat >= -90 &&
            lat <= 90
          );
        },
        message:
          "Invalid GPS coordinates. Expected [longitude, latitude] within [-180,180] and [-90,90].",
      },
    },
  },
  { _id: false }
);

const locationSchema = new Schema<ILocationDocument>(
  {
    name: {
      type: String,
      required: [true, "Location name is required"],
      trim: true,
      minlength: [2, "Location name must be at least 2 characters"],
      maxlength: [150, "Location name cannot exceed 150 characters"],
    },
    description: {
      type: String,
      required: [true, "Location description is required"],
      trim: true,
      minlength: [10, "Location description must be at least 10 characters"],
      maxlength: [2000, "Location description cannot exceed 2000 characters"],
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
      minlength: [5, "Address must be at least 5 characters"],
      maxlength: [300, "Address cannot exceed 300 characters"],
    },
    location: {
      type: geoPointSchema,
      required: [true, "GPS coordinates are required"],
    },
    category: {
      type: String,
      required: [true, "Location category is required"],
      enum: {
        values: ALL_LOCATION_CATEGORIES,
        message: "Invalid location category: {VALUE}",
      },
    },
    accessibilityScore: {
      type: Number,
      required: true,
      min: [0, "Accessibility score cannot be below 0"],
      max: [100, "Accessibility score cannot exceed 100"],
      default: 0,
    },
    accessibilityFeatures: {
      type: accessibilityFeaturesSchema,
      required: [true, "Accessibility features are required"],
    },
    photos: {
      type: [String],
      default: [],
      validate: {
        validator(urls: string[]) {
          return Array.isArray(urls) && urls.length <= 10;
        },
        message: "A location cannot have more than 10 photos",
      },
    },
    verificationStatus: {
      type: String,
      enum: {
        values: ALL_VERIFICATION_STATUSES,
        message: "Invalid verification status: {VALUE}",
      },
      default: VerificationStatus.PENDING,
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: [500, "Rejection reason cannot exceed 500 characters"],
    },
    submittedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Submitter user ID is required"],
    },
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    verifiedAt: {
      type: Date,
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

// Geospatial, filtering, sorting, and ownership indexes
locationSchema.index({ location: "2dsphere" });
locationSchema.index({ category: 1, verificationStatus: 1 });
locationSchema.index({ verificationStatus: 1, accessibilityScore: -1 });
locationSchema.index({ submittedBy: 1, createdAt: -1 });
locationSchema.index({ name: "text", address: "text", description: "text" });

export const Location: Model<ILocationDocument> = model<ILocationDocument>(
  "Location",
  locationSchema
);
