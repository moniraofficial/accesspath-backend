"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FailedLogin = void 0;
const mongoose_1 = require("mongoose");
const failedLoginSchema = new mongoose_1.Schema({
    key: {
        type: String,
        required: [true, "Key is required"],
        unique: true,
        trim: true,
    },
    attempts: {
        type: Number,
        required: [true, "Attempts is required"],
        default: 0,
        min: [0, "Attempts cannot be negative"],
    },
    expiresAt: {
        type: Date,
        required: [true, "Expiration date is required"],
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
// TTL index on expiresAt (automatically removes expired counter records)
failedLoginSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
exports.FailedLogin = (0, mongoose_1.model)("FailedLogin", failedLoginSchema);
//# sourceMappingURL=failed-login.model.js.map