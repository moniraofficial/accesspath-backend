"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toBarrierResponse = toBarrierResponse;
exports.createBarrier = createBarrier;
exports.listBarriers = listBarriers;
exports.getBarrierById = getBarrierById;
exports.updateBarrier = updateBarrier;
exports.deleteBarrier = deleteBarrier;
exports.verifyBarrier = verifyBarrier;
const mongoose_1 = __importDefault(require("mongoose"));
const barrier_model_js_1 = require("../models/barrier.model.js");
const roles_js_1 = require("../config/roles.js");
const barrier_types_js_1 = require("../types/barrier.types.js");
const ownership_js_1 = require("../utils/ownership.js");
const apiError_js_1 = require("../utils/apiError.js");
function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function toBarrierResponse(doc) {
    const coords = doc.location?.coordinates ?? [0, 0];
    const lng = typeof coords[0] === "number" ? coords[0] : 0;
    const lat = typeof coords[1] === "number" ? coords[1] : 0;
    return {
        id: doc._id.toString(),
        category: doc.category,
        description: doc.description,
        ...(doc.imageUrl !== undefined ? { imageUrl: doc.imageUrl } : {}),
        coordinates: {
            latitude: lat,
            longitude: lng,
        },
        location: doc.location,
        reportedBy: doc.reportedBy.toString(),
        status: doc.status,
        isVerified: doc.status === barrier_types_js_1.BarrierStatus.VERIFIED,
        ...(doc.rejectionReason !== undefined ? { rejectionReason: doc.rejectionReason } : {}),
        ...(doc.verifiedBy !== undefined ? { verifiedBy: doc.verifiedBy.toString() } : {}),
        ...(doc.verifiedAt !== undefined ? { verifiedAt: doc.verifiedAt } : {}),
        ...(doc.resolvedBy !== undefined ? { resolvedBy: doc.resolvedBy.toString() } : {}),
        ...(doc.resolvedAt !== undefined ? { resolvedAt: doc.resolvedAt } : {}),
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
    };
}
async function createBarrier(input, currentUser) {
    const canReport = (0, ownership_js_1.hasPermission)(currentUser.role, roles_js_1.Permissions.REPORT_BARRIERS) ||
        (0, ownership_js_1.hasPermission)(currentUser.role, roles_js_1.Permissions.MANAGE_BARRIERS);
    if (!canReport) {
        throw apiError_js_1.ApiError.forbidden("Access Denied: You do not have permission to report barriers.");
    }
    const created = await barrier_model_js_1.Barrier.create({
        category: input.category,
        description: input.description,
        ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl } : {}),
        location: input.location,
        reportedBy: new mongoose_1.default.Types.ObjectId(currentUser.id),
        status: barrier_types_js_1.BarrierStatus.PENDING,
    });
    return toBarrierResponse(created);
}
async function listBarriers(query) {
    const filter = {};
    if (query.category) {
        filter.category = query.category;
    }
    if (query.status) {
        filter.status = query.status;
    }
    if (query.reportedBy) {
        filter.reportedBy = new mongoose_1.default.Types.ObjectId(query.reportedBy);
    }
    if (query.search) {
        filter.description = new RegExp(escapeRegex(query.search), "i");
    }
    const skip = (query.page - 1) * query.limit;
    const sortDirection = query.sortOrder === "asc" ? 1 : -1;
    if (query.lat !== undefined && query.lng !== undefined) {
        const pipeline = [
            {
                $geoNear: {
                    near: { type: "Point", coordinates: [query.lng, query.lat] },
                    distanceField: "distanceMeters",
                    maxDistance: query.radiusKm * 1000,
                    spherical: true,
                    query: filter,
                },
            },
        ];
        if (query.sortBy !== "distance") {
            pipeline.push({ $sort: { [query.sortBy]: sortDirection, _id: 1 } });
        }
        else if (sortDirection === -1) {
            pipeline.push({ $sort: { distanceMeters: -1, _id: 1 } });
        }
        pipeline.push({
            $facet: {
                items: [{ $skip: skip }, { $limit: query.limit }],
                totalCount: [{ $count: "count" }],
            },
        });
        const [aggResult] = await barrier_model_js_1.Barrier.aggregate(pipeline);
        const rawItems = (aggResult?.items ?? []);
        const totalRecords = aggResult?.totalCount?.[0]?.count ?? 0;
        const totalPages = Math.max(1, Math.ceil(totalRecords / query.limit));
        return {
            items: rawItems.map(toBarrierResponse),
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
    const sortSpec = {
        createdAt: sortDirection,
        _id: 1,
    };
    const [docs, totalRecords] = await Promise.all([
        barrier_model_js_1.Barrier.find(filter).sort(sortSpec).skip(skip).limit(query.limit).lean(),
        barrier_model_js_1.Barrier.countDocuments(filter),
    ]);
    const totalPages = Math.max(1, Math.ceil(totalRecords / query.limit));
    return {
        items: docs.map((d) => toBarrierResponse(d)),
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
async function getBarrierById(barrierId) {
    const barrier = await barrier_model_js_1.Barrier.findById(barrierId).lean();
    if (!barrier) {
        throw apiError_js_1.ApiError.notFound("Barrier report not found.");
    }
    return toBarrierResponse(barrier);
}
async function updateBarrier(barrierId, updates, currentUser) {
    const barrier = await barrier_model_js_1.Barrier.findById(barrierId);
    if (!barrier) {
        throw apiError_js_1.ApiError.notFound("Barrier report not found.");
    }
    if (!(0, ownership_js_1.hasPermission)(currentUser.role, roles_js_1.Permissions.MANAGE_BARRIERS)) {
        (0, ownership_js_1.assertCanModifyOwnPendingResource)(barrier.reportedBy, barrier.status, currentUser, "barrier report");
    }
    if (updates.category !== undefined)
        barrier.category = updates.category;
    if (updates.description !== undefined)
        barrier.description = updates.description;
    if (updates.imageUrl !== undefined)
        barrier.imageUrl = updates.imageUrl;
    if (updates.location !== undefined)
        barrier.location = updates.location;
    const saved = await barrier.save();
    return toBarrierResponse(saved);
}
async function deleteBarrier(barrierId, currentUser) {
    const barrier = await barrier_model_js_1.Barrier.findById(barrierId);
    if (!barrier) {
        throw apiError_js_1.ApiError.notFound("Barrier report not found.");
    }
    if (!(0, ownership_js_1.hasPermission)(currentUser.role, roles_js_1.Permissions.MANAGE_BARRIERS)) {
        (0, ownership_js_1.assertCanModifyOwnPendingResource)(barrier.reportedBy, barrier.status, currentUser, "barrier report");
    }
    await barrier.deleteOne();
    return { id: barrierId };
}
async function verifyBarrier(barrierId, input, currentUser) {
    const barrier = await barrier_model_js_1.Barrier.findById(barrierId);
    if (!barrier) {
        throw apiError_js_1.ApiError.notFound("Barrier report not found.");
    }
    (0, ownership_js_1.assertCanModerateResource)(currentUser, barrier.reportedBy, roles_js_1.Permissions.VERIFY_BARRIERS, "barrier report");
    barrier.status = input.status;
    const moderatorObjectId = new mongoose_1.default.Types.ObjectId(currentUser.id);
    const now = new Date();
    if (input.status === barrier_types_js_1.BarrierStatus.RESOLVED) {
        barrier.resolvedBy = moderatorObjectId;
        barrier.resolvedAt = now;
        barrier.set("rejectionReason", undefined);
    }
    else if (input.status === barrier_types_js_1.BarrierStatus.REJECTED) {
        barrier.verifiedBy = moderatorObjectId;
        barrier.verifiedAt = now;
        if (input.rejectionReason) {
            barrier.rejectionReason = input.rejectionReason;
        }
    }
    else {
        barrier.verifiedBy = moderatorObjectId;
        barrier.verifiedAt = now;
        barrier.set("rejectionReason", undefined);
    }
    const saved = await barrier.save();
    return toBarrierResponse(saved);
}
//# sourceMappingURL=barrier.service.js.map