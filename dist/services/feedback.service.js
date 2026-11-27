"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toFeedbackResponse = toFeedbackResponse;
exports.createFeedback = createFeedback;
exports.listFeedback = listFeedback;
exports.updateFeedback = updateFeedback;
exports.deleteFeedback = deleteFeedback;
exports.moderateFeedback = moderateFeedback;
const mongoose_1 = __importDefault(require("mongoose"));
const feedback_model_js_1 = require("../models/feedback.model.js");
const location_model_js_1 = require("../models/location.model.js");
const roles_js_1 = require("../config/roles.js");
const feedback_types_js_1 = require("../types/feedback.types.js");
const ownership_js_1 = require("../utils/ownership.js");
const apiError_js_1 = require("../utils/apiError.js");
function toFeedbackResponse(doc) {
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
async function createFeedback(input, currentUser) {
    if (!(0, ownership_js_1.hasPermission)(currentUser.role, roles_js_1.Permissions.SUBMIT_FEEDBACK)) {
        throw apiError_js_1.ApiError.forbidden("Access Denied: You do not have permission to submit feedback.");
    }
    const locationExists = await location_model_js_1.Location.exists({ _id: input.locationId });
    if (!locationExists) {
        throw apiError_js_1.ApiError.notFound("Target location not found.");
    }
    const created = await feedback_model_js_1.Feedback.create({
        locationId: new mongoose_1.default.Types.ObjectId(input.locationId),
        userId: new mongoose_1.default.Types.ObjectId(currentUser.id),
        rating: input.rating,
        comment: input.comment,
        status: feedback_types_js_1.FeedbackStatus.ACTIVE,
    });
    return toFeedbackResponse(created);
}
async function listFeedback(query, currentUser) {
    const filter = {};
    if (query.locationId) {
        filter.locationId = new mongoose_1.default.Types.ObjectId(query.locationId);
    }
    const canModerate = currentUser
        ? (0, ownership_js_1.hasPermission)(currentUser.role, roles_js_1.Permissions.MODERATE_FEEDBACK)
        : false;
    if (query.status && canModerate) {
        filter.status = query.status;
    }
    else {
        filter.status = feedback_types_js_1.FeedbackStatus.ACTIVE;
    }
    const skip = (query.page - 1) * query.limit;
    const [docs, totalRecords] = await Promise.all([
        feedback_model_js_1.Feedback.find(filter).sort({ createdAt: -1, _id: 1 }).skip(skip).limit(query.limit).lean(),
        feedback_model_js_1.Feedback.countDocuments(filter),
    ]);
    const totalPages = Math.max(1, Math.ceil(totalRecords / query.limit));
    return {
        items: docs.map((d) => toFeedbackResponse(d)),
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
async function updateFeedback(feedbackId, updates, currentUser) {
    const feedback = await feedback_model_js_1.Feedback.findById(feedbackId);
    if (!feedback) {
        throw apiError_js_1.ApiError.notFound("Feedback record not found.");
    }
    // Strict ownership check: only the author can edit their feedback
    (0, ownership_js_1.assertResourceOwnership)(feedback.userId, currentUser, "feedback");
    if (updates.rating !== undefined)
        feedback.rating = updates.rating;
    if (updates.comment !== undefined)
        feedback.comment = updates.comment;
    const saved = await feedback.save();
    return toFeedbackResponse(saved);
}
async function deleteFeedback(feedbackId, currentUser) {
    const feedback = await feedback_model_js_1.Feedback.findById(feedbackId);
    if (!feedback) {
        throw apiError_js_1.ApiError.notFound("Feedback record not found.");
    }
    if (!(0, ownership_js_1.hasPermission)(currentUser.role, roles_js_1.Permissions.MODERATE_FEEDBACK)) {
        (0, ownership_js_1.assertResourceOwnership)(feedback.userId, currentUser, "feedback");
    }
    await feedback.deleteOne();
    return { id: feedbackId };
}
async function moderateFeedback(feedbackId, input, currentUser) {
    if (!(0, ownership_js_1.hasPermission)(currentUser.role, roles_js_1.Permissions.MODERATE_FEEDBACK)) {
        throw apiError_js_1.ApiError.forbidden("Access Denied: Insufficient permissions to moderate feedback.");
    }
    const feedback = await feedback_model_js_1.Feedback.findById(feedbackId);
    if (!feedback) {
        throw apiError_js_1.ApiError.notFound("Feedback record not found.");
    }
    feedback.status = input.status;
    feedback.moderatedBy = new mongoose_1.default.Types.ObjectId(currentUser.id);
    feedback.moderatedAt = new Date();
    const saved = await feedback.save();
    return toFeedbackResponse(saved);
}
//# sourceMappingURL=feedback.service.js.map