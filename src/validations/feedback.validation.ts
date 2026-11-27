import { FeedbackStatus, FeedbackStatusType } from "../types/feedback.types.js";
import { ApiError } from "../utils/apiError.js";
import { validateObjectIdParam } from "./location.validation.js";

export interface ICreateFeedbackInput {
  locationId: string;
  rating: number;
  comment: string;
}

export interface IUpdateFeedbackInput {
  rating?: number;
  comment?: string;
}

export interface IModerateFeedbackInput {
  status: FeedbackStatusType;
}

export interface IFeedbackQuery {
  page: number;
  limit: number;
  locationId?: string;
  status?: FeedbackStatusType;
}

function validateRating(value: unknown): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > 5) {
    throw ApiError.badRequest("Rating must be an integer between 1 and 5.");
  }
  return value;
}

function validateComment(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) {
    throw ApiError.badRequest("Comment is required and must be a non-empty string.");
  }
  const trimmed = value.trim();
  if (trimmed.length < 5 || trimmed.length > 1000) {
    throw ApiError.badRequest("Comment must be between 5 and 1000 characters.");
  }
  return trimmed;
}

export function validateCreateFeedbackInput(data: unknown): ICreateFeedbackInput {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw ApiError.badRequest("Invalid request body: expected JSON object.");
  }

  const body = data as Record<string, unknown>;
  return {
    locationId: validateObjectIdParam(body.locationId, "locationId"),
    rating: validateRating(body.rating),
    comment: validateComment(body.comment),
  };
}

export function validateUpdateFeedbackInput(data: unknown): IUpdateFeedbackInput {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw ApiError.badRequest("Invalid request body: expected JSON object.");
  }

  const body = data as Record<string, unknown>;
  const updates: IUpdateFeedbackInput = {};

  if ("rating" in body && body.rating !== undefined) {
    updates.rating = validateRating(body.rating);
  }
  if ("comment" in body && body.comment !== undefined) {
    updates.comment = validateComment(body.comment);
  }

  if (Object.keys(updates).length === 0) {
    throw ApiError.badRequest("At least one valid updatable field (rating or comment) is required.");
  }

  return updates;
}

export function validateModerateFeedbackInput(data: unknown): IModerateFeedbackInput {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw ApiError.badRequest("Invalid request body: expected JSON object.");
  }

  const status = (data as Record<string, unknown>).status;
  if (status !== FeedbackStatus.ACTIVE && status !== FeedbackStatus.HIDDEN) {
    throw ApiError.badRequest("Feedback moderation status must be 'active' or 'hidden'.");
  }

  return { status };
}

export function validatePaginationParams(query: unknown): { page: number; limit: number } {
  const q = (query && typeof query === "object" ? query : {}) as Record<string, unknown>;
  const page = q.page !== undefined ? Number(q.page) : 1;
  const limit = q.limit !== undefined ? Number(q.limit) : 20;

  if (!Number.isInteger(page) || page < 1) {
    throw ApiError.badRequest("page must be an integer >= 1.");
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw ApiError.badRequest("limit must be an integer between 1 and 100.");
  }

  return { page, limit };
}

export function validateFeedbackQuery(query: unknown): IFeedbackQuery {
  const q = (query && typeof query === "object" ? query : {}) as Record<string, unknown>;
  const { page, limit } = validatePaginationParams(q);

  let locationId: string | undefined;
  if (q.locationId !== undefined && q.locationId !== "") {
    locationId = validateObjectIdParam(q.locationId, "locationId");
  }

  let status: FeedbackStatusType | undefined;
  if (q.status !== undefined && q.status !== "") {
    if (q.status !== FeedbackStatus.ACTIVE && q.status !== FeedbackStatus.HIDDEN) {
      throw ApiError.badRequest("Invalid feedback status filter.");
    }
    status = q.status;
  }

  return {
    page,
    limit,
    ...(locationId !== undefined ? { locationId } : {}),
    ...(status !== undefined ? { status } : {}),
  };
}
