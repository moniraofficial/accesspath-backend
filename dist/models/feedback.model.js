"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Feedback = void 0;
const mongoose_1 = require("mongoose");
const feedback_types_js_1 = require("../types/feedback.types.js");
const feedbackSchema = new mongoose_1.Schema({
    locationId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Location",
        required: [true, "Location ID is required"],
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
        enum: [feedback_types_js_1.FeedbackStatus.ACTIVE, feedback_types_js_1.FeedbackStatus.HIDDEN],
        default: feedback_types_js_1.FeedbackStatus.ACTIVE,
    },
    moderatedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
    },
    moderatedAt: {
        type: Date,
    },
}, {
    timestamps: true,
    toJSON: {
        transform(_doc, ret) {
            delete ret.__v;
            if (ret._id) {
                ret.id = ret._id.toString();
                delete ret._id;
            }
            return ret;
        },
    },
    toObject: {
        transform(_doc, ret) {
            delete ret.__v;
            if (ret._id) {
                ret.id = ret._id.toString();
                delete ret._id;
            }
            return ret;
        },
    },
});
feedbackSchema.index({ locationId: 1, status: 1, createdAt: -1 });
feedbackSchema.index({ userId: 1, createdAt: -1 });
exports.Feedback = (0, mongoose_1.model)("Feedback", feedbackSchema);
//# sourceMappingURL=feedback.model.js.map