"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefreshToken = void 0;
const mongoose_1 = require("mongoose");
const refreshTokenSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "User ID is required"],
        index: true,
    },
    jti: {
        type: String,
        required: [true, "JTI is required"],
        unique: true,
        trim: true,
    },
    familyId: {
        type: String,
        required: [true, "Family ID is required"],
        index: true,
        trim: true,
    },
    tokenHash: {
        type: String,
        required: [true, "Token hash is required"],
        select: false, // Prevents cryptographic hash from being selected by default
    },
    isUsed: {
        type: Boolean,
        default: false,
    },
    isRevoked: {
        type: Boolean,
        default: false,
    },
    expiresAt: {
        type: Date,
        required: [true, "Expiration date is required"],
    },
    rotatedAt: {
        type: Date,
    },
    userAgent: {
        type: String,
        trim: true,
    },
    ipAddress: {
        type: String,
        trim: true,
    },
    // Optional encrypted replacement-payload fields for the 15-second grace window
    replacementPayload: {
        type: String,
        select: false,
    },
    encryptionIv: {
        type: String,
        select: false,
    },
    encryptionTag: {
        type: String,
        select: false,
    },
    encryptionKeyVersion: {
        type: String,
        trim: true,
    },
    replacementExpiresAt: {
        type: Date, // Explicitly NOT a TTL index; preserved for the full token validity
    },
}, {
    timestamps: true,
    toJSON: {
        transform(_doc, ret) {
            delete ret.tokenHash;
            delete ret.replacementPayload;
            delete ret.encryptionIv;
            delete ret.encryptionTag;
            delete ret.encryptionKeyVersion;
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
            delete ret.tokenHash;
            delete ret.replacementPayload;
            delete ret.encryptionIv;
            delete ret.encryptionTag;
            delete ret.encryptionKeyVersion;
            delete ret.__v;
            if (ret._id) {
                ret.id = ret._id.toString();
                delete ret._id;
            }
            return ret;
        },
    },
});
// TTL index on expiresAt (cleans up token record only after full refresh-token lifetime)
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
exports.RefreshToken = (0, mongoose_1.model)("RefreshToken", refreshTokenSchema);
//# sourceMappingURL=refresh-token.model.js.map