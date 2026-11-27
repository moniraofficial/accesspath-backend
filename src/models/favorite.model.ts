import { Schema, model, Model } from "mongoose";
import { IFavoriteDocument } from "../types/favorite.types.js";

const favoriteSchema = new Schema<IFavoriteDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    locationId: {
      type: Schema.Types.ObjectId,
      ref: "Location",
      required: [true, "Location ID is required"],
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

favoriteSchema.index({ userId: 1, locationId: 1 }, { unique: true });
favoriteSchema.index({ userId: 1, createdAt: -1 });

export const Favorite: Model<IFavoriteDocument> = model<IFavoriteDocument>(
  "Favorite",
  favoriteSchema
);
