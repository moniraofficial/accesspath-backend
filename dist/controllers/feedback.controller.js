"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = create;
exports.list = list;
exports.update = update;
exports.remove = remove;
exports.moderate = moderate;
const feedback_validation_js_1 = require("../validations/feedback.validation.js");
const location_validation_js_1 = require("../validations/location.validation.js");
const feedback_service_js_1 = require("../services/feedback.service.js");
const apiResponse_js_1 = require("../utils/apiResponse.js");
const apiError_js_1 = require("../utils/apiError.js");
async function create(req, res, next) {
    try {
        if (!req.user) {
            return next(apiError_js_1.ApiError.unauthorized("Authentication required."));
        }
        const input = (0, feedback_validation_js_1.validateCreateFeedbackInput)(req.body);
        const created = await (0, feedback_service_js_1.createFeedback)(input, req.user);
        (0, apiResponse_js_1.sendResponse)(res, 201, "Feedback submitted successfully.", created);
    }
    catch (error) {
        next(error);
    }
}
async function list(req, res, next) {
    try {
        const query = (0, feedback_validation_js_1.validateFeedbackQuery)(req.query);
        const { items, meta } = await (0, feedback_service_js_1.listFeedback)(query, req.user);
        (0, apiResponse_js_1.sendResponse)(res, 200, "Feedback retrieved successfully.", items, meta);
    }
    catch (error) {
        next(error);
    }
}
async function update(req, res, next) {
    try {
        if (!req.user) {
            return next(apiError_js_1.ApiError.unauthorized("Authentication required."));
        }
        const id = (0, location_validation_js_1.validateObjectIdParam)(req.params.id, "feedback ID");
        const updates = (0, feedback_validation_js_1.validateUpdateFeedbackInput)(req.body);
        const updated = await (0, feedback_service_js_1.updateFeedback)(id, updates, req.user);
        (0, apiResponse_js_1.sendResponse)(res, 200, "Feedback updated successfully.", updated);
    }
    catch (error) {
        next(error);
    }
}
async function remove(req, res, next) {
    try {
        if (!req.user) {
            return next(apiError_js_1.ApiError.unauthorized("Authentication required."));
        }
        const id = (0, location_validation_js_1.validateObjectIdParam)(req.params.id, "feedback ID");
        const deleted = await (0, feedback_service_js_1.deleteFeedback)(id, req.user);
        (0, apiResponse_js_1.sendResponse)(res, 200, "Feedback deleted successfully.", deleted);
    }
    catch (error) {
        next(error);
    }
}
async function moderate(req, res, next) {
    try {
        if (!req.user) {
            return next(apiError_js_1.ApiError.unauthorized("Authentication required."));
        }
        const id = (0, location_validation_js_1.validateObjectIdParam)(req.params.id, "feedback ID");
        const input = (0, feedback_validation_js_1.validateModerateFeedbackInput)(req.body);
        const updated = await (0, feedback_service_js_1.moderateFeedback)(id, input, req.user);
        (0, apiResponse_js_1.sendResponse)(res, 200, `Feedback ${input.status} successfully.`, updated);
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=feedback.controller.js.map