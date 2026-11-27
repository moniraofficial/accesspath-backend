"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Favorite = void 0;
const mongoose_1 = require("mongoose");
const favoriteSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "User ID is required"],
    },
    locationId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Location",
        required: [true, "Location ID is required"],
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
favoriteSchema.index({ userId: 1, locationId: 1 }, { unique: true });
favoriteSchema.index({ userId: 1, createdAt: -1 });
exports.Favorite = (0, mongoose_1.model)("Favorite", favoriteSchema);
//# sourceMappingURL=favorite.model.js.map