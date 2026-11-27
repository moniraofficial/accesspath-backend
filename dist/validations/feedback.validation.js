"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCreateFeedbackInput = validateCreateFeedbackInput;
exports.validateUpdateFeedbackInput = validateUpdateFeedbackInput;
exports.validateModerateFeedbackInput = validateModerateFeedbackInput;
exports.validatePaginationParams = validatePaginationParams;
exports.validateFeedbackQuery = validateFeedbackQuery;
const feedback_types_js_1 = require("../types/feedback.types.js");
const apiError_js_1 = require("../utils/apiError.js");
const location_validation_js_1 = require("./location.validation.js");
function validateRating(value) {
    if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > 5) {
        throw apiError_js_1.ApiError.badRequest("Rating must be an integer between 1 and 5.");
    }
    return value;
}
function validateComment(value) {
    if (typeof value !== "string" || !value.trim()) {
        throw apiError_js_1.ApiError.badRequest("Comment is required and must be a non-empty string.");
    }
    const trimmed = value.trim();
    if (trimmed.length < 5 || trimmed.length > 1000) {
        throw apiError_js_1.ApiError.badRequest("Comment must be between 5 and 1000 characters.");
    }
    return trimmed;
}
function validateCreateFeedbackInput(data) {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw apiError_js_1.ApiError.badRequest("Invalid request body: expected JSON object.");
    }
    const body = data;
    return {
        locationId: (0, location_validation_js_1.validateObjectIdParam)(body.locationId, "locationId"),
        rating: validateRating(body.rating),
        comment: validateComment(body.comment),
    };
}
function validateUpdateFeedbackInput(data) {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw apiError_js_1.ApiError.badRequest("Invalid request body: expected JSON object.");
    }
    const body = data;
    const updates = {};
    if ("rating" in body && body.rating !== undefined) {
        updates.rating = validateRating(body.rating);
    }
    if ("comment" in body && body.comment !== undefined) {
        updates.comment = validateComment(body.comment);
    }
    if (Object.keys(updates).length === 0) {
        throw apiError_js_1.ApiError.badRequest("At least one valid updatable field (rating or comment) is required.");
    }
    return updates;
}
function validateModerateFeedbackInput(data) {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw apiError_js_1.ApiError.badRequest("Invalid request body: expected JSON object.");
    }
    const status = data.status;
    if (status !== feedback_types_js_1.FeedbackStatus.ACTIVE && status !== feedback_types_js_1.FeedbackStatus.HIDDEN) {
        throw apiError_js_1.ApiError.badRequest("Feedback moderation status must be 'active' or 'hidden'.");
    }
    return { status };
}
function validatePaginationParams(query) {
    const q = (query && typeof query === "object" ? query : {});
    const page = q.page !== undefined ? Number(q.page) : 1;
    const limit = q.limit !== undefined ? Number(q.limit) : 20;
    if (!Number.isInteger(page) || page < 1) {
        throw apiError_js_1.ApiError.badRequest("page must be an integer >= 1.");
    }
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
        throw apiError_js_1.ApiError.badRequest("limit must be an integer between 1 and 100.");
    }
    return { page, limit };
}
function validateFeedbackQuery(query) {
    const q = (query && typeof query === "object" ? query : {});
    const { page, limit } = validatePaginationParams(q);
    let locationId;
    if (q.locationId !== undefined && q.locationId !== "") {
        locationId = (0, location_validation_js_1.validateObjectIdParam)(q.locationId, "locationId");
    }
    let status;
    if (q.status !== undefined && q.status !== "") {
        if (q.status !== feedback_types_js_1.FeedbackStatus.ACTIVE && q.status !== feedback_types_js_1.FeedbackStatus.HIDDEN) {
            throw apiError_js_1.ApiError.badRequest("Invalid feedback status filter.");
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
//# sourceMappingURL=feedback.validation.js.map