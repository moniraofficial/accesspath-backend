import { Schema, model, Model } from "mongoose";
import { FeedbackStatus, IFeedbackDocument } from "../types/feedback.types.js";

const feedbackSchema = new Schema<IFeedbackDocument>(
  {
    locationId: {
      type: Schema.Types.ObjectId,
      ref: "Location",
      required: [true, "Location ID is required"],
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
    comment: {
      type: String,
      required: [true, "Feedback comment is required"],
      trim: true,
      minlength: [5, "Comment must be at least 5 characters"],
      maxlength: [1000, "Comment cannot exceed 1000 characters"],
    },
    status: {
      type: String,
      enum: [FeedbackStatus.ACTIVE, FeedbackStatus.HIDDEN],
      default: FeedbackStatus.ACTIVE,
    },
    moderatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    moderatedAt: {
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

feedbackSchema.index({ locationId: 1, status: 1, createdAt: -1 });
feedbackSchema.index({ userId: 1, createdAt: -1 });

export const Feedback: Model<IFeedbackDocument> = model<IFeedbackDocument>(
  "Feedback",
  feedbackSchema
);
