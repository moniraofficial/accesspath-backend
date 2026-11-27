import mongoose from "mongoose";
import { Favorite } from "../models/favorite.model.js";
import { Location } from "../models/location.model.js";
import { Permissions } from "../config/roles.js";
import { IAuthUser, IPaginationMeta } from "../types/index.js";
import { IFavoriteResponse } from "../types/favorite.types.js";
import { ILocationResponse } from "../types/location.types.js";
import { hasPermission } from "../utils/ownership.js";
import { ApiError } from "../utils/apiError.js";
import { toLocationResponse } from "./location.service.js";

export interface IFavoriteWithLocation {
  favoriteId: string;
  savedAt: Date;
  location: ILocationResponse;
}

export async function addFavorite(
  locationId: string,
  currentUser: IAuthUser
): Promise<IFavoriteResponse> {
  if (!hasPermission(currentUser.role, Permissions.MANAGE_FAVORITES)) {
    throw ApiError.forbidden("Access Denied: You do not have permission to manage favorites.");
  }

  const locationExists = await Location.exists({ _id: locationId });
  if (!locationExists) {
    throw ApiError.notFound("Location not found.");
  }

  const userObjectId = new mongoose.Types.ObjectId(currentUser.id);
  const locationObjectId = new mongoose.Types.ObjectId(locationId);

  const favorite = await Favorite.findOneAndUpdate(
    { userId: userObjectId, locationId: locationObjectId },
    { $setOnInsert: { userId: userObjectId, locationId: locationObjectId } },
    { upsert: true, returnDocument: "after" }
  );

  if (!favorite) {
    throw ApiError.internal("Failed to save favorite location.");
  }

  return {
    id: favorite._id.toString(),
    userId: favorite.userId.toString(),
    locationId: favorite.locationId.toString(),
    createdAt: favorite.createdAt,
  };
}

export async function removeFavorite(
  locationId: string,
  currentUser: IAuthUser
): Promise<{ locationId: string }> {
  if (!hasPermission(currentUser.role, Permissions.MANAGE_FAVORITES)) {
    throw ApiError.forbidden("Access Denied: You do not have permission to manage favorites.");
  }

  const deleted = await Favorite.findOneAndDelete({
    userId: new mongoose.Types.ObjectId(currentUser.id),
    locationId: new mongoose.Types.ObjectId(locationId),
  });

  if (!deleted) {
    throw ApiError.notFound("Location is not in your favorites.");
  }

  return { locationId };
}

export async function listFavorites(
  currentUser: IAuthUser,
  page: number,
  limit: number
): Promise<{ items: IFavoriteWithLocation[]; meta: IPaginationMeta }> {
  if (!hasPermission(currentUser.role, Permissions.MANAGE_FAVORITES)) {
    throw ApiError.forbidden("Access Denied: You do not have permission to view favorites.");
  }

  const filter = { userId: new mongoose.Types.ObjectId(currentUser.id) };
  const skip = (page - 1) * limit;

  const [docs, totalRecords] = await Promise.all([
    Favorite.find(filter)
      .sort({ createdAt: -1, _id: 1 })
      .skip(skip)
      .limit(limit)
      .populate("locationId")
      .lean(),
    Favorite.countDocuments(filter),
  ]);

  const items: IFavoriteWithLocation[] = [];
  for (const doc of docs) {
    const populatedLoc = doc.locationId as unknown as
      | (Record<string, any> & { _id: mongoose.Types.ObjectId })
      | null;
    if (populatedLoc && populatedLoc._id) {
      items.push({
        favoriteId: doc._id.toString(),
        savedAt: doc.createdAt,
        location: toLocationResponse(populatedLoc),
      });
    }
  }

  const totalPages = Math.max(1, Math.ceil(totalRecords / limit));

  return {
    items,
    meta: {
      page,
      limit,
      totalRecords,
      totalPages,
      hasNextPage: page < totalPages && totalRecords > 0,
      hasPrevPage: page > 1,
    },
  };
}
