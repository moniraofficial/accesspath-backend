import mongoose from "mongoose";
import { Feedback } from "../models/feedback.model.js";
import { Location } from "../models/location.model.js";
import { Permissions } from "../config/roles.js";
import { IAuthUser, IPaginationMeta } from "../types/index.js";
import {
  FeedbackStatus,
  IFeedbackDocument,
  IFeedbackResponse,
} from "../types/feedback.types.js";
import {
  ICreateFeedbackInput,
  IFeedbackQuery,
  IModerateFeedbackInput,
  IUpdateFeedbackInput,
} from "../validations/feedback.validation.js";
import {
  assertResourceOwnership,
  hasPermission,
} from "../utils/ownership.js";
import { ApiError } from "../utils/apiError.js";

export function toFeedbackResponse(
  doc: IFeedbackDocument | (Record<string, any> & { _id: mongoose.Types.ObjectId })
): IFeedbackResponse {
  return {
    id: doc._id.toString(),
    locationId: doc.locationId.toString(),
    userId: doc.userId.toString(),
    rating: doc.rating,
    comment: doc.comment,
    status: doc.status,
    ...(doc.moderatedBy !== undefined ? { moderatedBy: doc.moderatedBy.toString() } : {}),
    ...(doc.moderatedAt !== undefined ? { moderatedAt: doc.moderatedAt } : {}),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function createFeedback(
  input: ICreateFeedbackInput,
  currentUser: IAuthUser
): Promise<IFeedbackResponse> {
  if (!hasPermission(currentUser.role, Permissions.SUBMIT_FEEDBACK)) {
    throw ApiError.forbidden("Access Denied: You do not have permission to submit feedback.");
  }

  const locationExists = await Location.exists({ _id: input.locationId });
  if (!locationExists) {
    throw ApiError.notFound("Target location not found.");
  }

  const created = await Feedback.create({
    locationId: new mongoose.Types.ObjectId(input.locationId),
    userId: new mongoose.Types.ObjectId(currentUser.id),
    rating: input.rating,
    comment: input.comment,
    status: FeedbackStatus.ACTIVE,
  });

  return toFeedbackResponse(created);
}

export async function listFeedback(
  query: IFeedbackQuery,
  currentUser?: IAuthUser
): Promise<{ items: IFeedbackResponse[]; meta: IPaginationMeta }> {
  const filter: Record<string, unknown> = {};

  if (query.locationId) {
    filter.locationId = new mongoose.Types.ObjectId(query.locationId);
  }

  const canModerate = currentUser
    ? hasPermission(currentUser.role, Permissions.MODERATE_FEEDBACK)
    : false;

  if (query.status && canModerate) {
    filter.status = query.status;
  } else {
    filter.status = FeedbackStatus.ACTIVE;
  }

  const skip = (query.page - 1) * query.limit;
  const [docs, totalRecords] = await Promise.all([
    Feedback.find(filter).sort({ createdAt: -1, _id: 1 }).skip(skip).limit(query.limit).lean(),
    Feedback.countDocuments(filter),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalRecords / query.limit));

  return {
    items: docs.map((d) =>
      toFeedbackResponse(d as Record<string, any> & { _id: mongoose.Types.ObjectId })
    ),
    meta: {
      page: query.page,
      limit: query.limit,
      totalRecords,
      totalPages,
      hasNextPage: query.page < totalPages && totalRecords > 0,
      hasPrevPage: query.page > 1,
    },
  };
}

export async function updateFeedback(
  feedbackId: string,
  updates: IUpdateFeedbackInput,
  currentUser: IAuthUser
): Promise<IFeedbackResponse> {
  const feedback = await Feedback.findById(feedbackId);
  if (!feedback) {
    throw ApiError.notFound("Feedback record not found.");
  }

  // Strict ownership check: only the author can edit their feedback
  assertResourceOwnership(feedback.userId, currentUser, "feedback");

  if (updates.rating !== undefined) feedback.rating = updates.rating;
  if (updates.comment !== undefined) feedback.comment = updates.comment;

  const saved = await feedback.save();
  return toFeedbackResponse(saved);
}

export async function deleteFeedback(
  feedbackId: string,
  currentUser: IAuthUser
): Promise<{ id: string }> {
  const feedback = await Feedback.findById(feedbackId);
  if (!feedback) {
    throw ApiError.notFound("Feedback record not found.");
  }

  if (!hasPermission(currentUser.role, Permissions.MODERATE_FEEDBACK)) {
    assertResourceOwnership(feedback.userId, currentUser, "feedback");
  }

  await feedback.deleteOne();
  return { id: feedbackId };
}

export async function moderateFeedback(
  feedbackId: string,
  input: IModerateFeedbackInput,
  currentUser: IAuthUser
): Promise<IFeedbackResponse> {
  if (!hasPermission(currentUser.role, Permissions.MODERATE_FEEDBACK)) {
    throw ApiError.forbidden("Access Denied: Insufficient permissions to moderate feedback.");
  }

  const feedback = await Feedback.findById(feedbackId);
  if (!feedback) {
    throw ApiError.notFound("Feedback record not found.");
  }

  feedback.status = input.status;
  feedback.moderatedBy = new mongoose.Types.ObjectId(currentUser.id);
  feedback.moderatedAt = new Date();

  const saved = await feedback.save();
  return toFeedbackResponse(saved);
}
