"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Barrier = void 0;
const mongoose_1 = require("mongoose");
const barrier_types_js_1 = require("../types/barrier.types.js");
const barrierGeoPointSchema = new mongoose_1.Schema({
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
            validator(coords) {
                if (!Array.isArray(coords) || coords.length !== 2) {
                    return false;
                }
                const [lng, lat] = coords;
                return (typeof lng === "number" &&
                    typeof lat === "number" &&
                    Number.isFinite(lng) &&
                    Number.isFinite(lat) &&
                    lng >= -180 &&
                    lng <= 180 &&
                    lat >= -90 &&
                    lat <= 90);
            },
            message: "Invalid GPS coordinates.",
        },
    },
}, { _id: false });
const barrierSchema = new mongoose_1.Schema({
    category: {
        type: String,
        required: [true, "Barrier category is required"],
        enum: {
            values: barrier_types_js_1.ALL_BARRIER_CATEGORIES,
            message: "Invalid barrier category: {VALUE}",
        },
    },
    description: {
        type: String,
        required: [true, "Barrier description is required"],
        trim: true,
        minlength: [10, "Barrier description must be at least 10 characters"],
        maxlength: [1500, "Barrier description cannot exceed 1500 characters"],
    },
    imageUrl: {
        type: String,
        trim: true,
    },
    location: {
        type: barrierGeoPointSchema,
        required: [true, "GPS location is required"],
    },
    reportedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Reporter user ID is required"],
    },
    status: {
        type: String,
        enum: {
            values: barrier_types_js_1.ALL_BARRIER_STATUSES,
            message: "Invalid barrier status: {VALUE}",
        },
        default: barrier_types_js_1.BarrierStatus.PENDING,
    },
    rejectionReason: {
        type: String,
        trim: true,
        maxlength: [500, "Rejection reason cannot exceed 500 characters"],
    },
    verifiedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
    },
    verifiedAt: {
        type: Date,
    },
    resolvedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
    },
    resolvedAt: {
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
barrierSchema.index({ location: "2dsphere" });
barrierSchema.index({ category: 1, status: 1 });
barrierSchema.index({ status: 1, createdAt: -1 });
barrierSchema.index({ reportedBy: 1, createdAt: -1 });
exports.Barrier = (0, mongoose_1.model)("Barrier", barrierSchema);
//# sourceMappingURL=barrier.model.js.map