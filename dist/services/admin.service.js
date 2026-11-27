"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listUsersForAdmin = listUsersForAdmin;
exports.updateUserByAdmin = updateUserByAdmin;
exports.getPlatformAnalytics = getPlatformAnalytics;
const mongoose_1 = __importDefault(require("mongoose"));
const user_model_js_1 = require("../models/user.model.js");
const refresh_token_model_js_1 = require("../models/refresh-token.model.js");
const location_model_js_1 = require("../models/location.model.js");
const barrier_model_js_1 = require("../models/barrier.model.js");
const feedback_model_js_1 = require("../models/feedback.model.js");
const barrier_types_js_1 = require("../types/barrier.types.js");
const location_types_js_1 = require("../types/location.types.js");
const auth_service_js_1 = require("./auth.service.js");
const apiError_js_1 = require("../utils/apiError.js");
function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
async function listUsersForAdmin(query) {
    const filter = {};
    if (query.role) {
        filter.role = query.role;
    }
    if (query.isActive !== undefined) {
        filter.isActive = query.isActive;
    }
    if (query.search) {
        const safePattern = new RegExp(escapeRegex(query.search), "i");
        filter.$or = [{ name: safePattern }, { email: safePattern }];
    }
    const skip = (query.page - 1) * query.limit;
    const [docs, totalRecords] = await Promise.all([
        user_model_js_1.User.find(filter).sort({ createdAt: -1, _id: 1 }).skip(skip).limit(query.limit),
        user_model_js_1.User.countDocuments(filter),
    ]);
    const totalPages = Math.max(1, Math.ceil(totalRecords / query.limit));
    return {
        items: docs.map((u) => (0, auth_service_js_1.toUserResponse)(u)),
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
async function updateUserByAdmin(targetUserId, updates, currentAdmin) {
    if (targetUserId === currentAdmin.id) {
        if (updates.isActive === false || (updates.role && updates.role !== currentAdmin.role)) {
            throw apiError_js_1.ApiError.badRequest("Admins cannot deactivate or demote their own account.");
        }
    }
    const user = await user_model_js_1.User.findById(targetUserId);
    if (!user) {
        throw apiError_js_1.ApiError.notFound("User account not found.");
    }
    const sessionRevocationNeeded = (updates.role !== undefined && updates.role !== user.role) ||
        (updates.isActive !== undefined && updates.isActive !== user.isActive);
    if (updates.role !== undefined) {
        user.role = updates.role;
    }
    if (updates.isActive !== undefined) {
        user.isActive = updates.isActive;
    }
    if (sessionRevocationNeeded) {
        user.tokenVersion += 1;
    }
    const saved = await user.save();
    if (updates.isActive === false) {
        await refresh_token_model_js_1.RefreshToken.updateMany({ userId: new mongoose_1.default.Types.ObjectId(targetUserId), isRevoked: false }, { $set: { isRevoked: true } });
    }
    return (0, auth_service_js_1.toUserResponse)(saved);
}
async function getPlatformAnalytics() {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setUTCMonth(twelveMonthsAgo.getUTCMonth() - 11);
    twelveMonthsAgo.setUTCDate(1);
    twelveMonthsAgo.setUTCHours(0, 0, 0, 0);
    const [locationSummaryAgg, locationCategoryDist, barrierSummaryAgg, barrierCategoryDist, mostReportedAreas, monthlyReportTrends, totalFeedbackRecords, usersByRole, topLocationContributors, topBarrierReporters,] = await Promise.all([
        location_model_js_1.Location.aggregate([
            {
                $group: {
                    _id: "$verificationStatus",
                    count: { $sum: 1 },
                },
            },
        ]),
        location_model_js_1.Location.aggregate([
            {
                $group: {
                    _id: "$category",
                    count: { $sum: 1 },
                    avgAccessibilityScore: { $avg: "$accessibilityScore" },
                },
            },
            { $sort: { count: -1 } },
        ]),
        barrier_model_js_1.Barrier.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                },
            },
        ]),
        barrier_model_js_1.Barrier.aggregate([
            {
                $group: {
                    _id: "$category",
                    count: { $sum: 1 },
                },
            },
            { $sort: { count: -1 } },
        ]),
        barrier_model_js_1.Barrier.aggregate([
            {
                $project: {
                    latBucket: {
                        $round: [{ $arrayElemAt: ["$location.coordinates", 1] }, 2],
                    },
                    lngBucket: {
                        $round: [{ $arrayElemAt: ["$location.coordinates", 0] }, 2],
                    },
                },
            },
            {
                $group: {
                    _id: { latitude: "$latBucket", longitude: "$lngBucket" },
                    reportCount: { $sum: 1 },
                },
            },
            { $sort: { reportCount: -1 } },
            { $limit: 10 },
            {
                $project: {
                    _id: 0,
                    latitude: "$_id.latitude",
                    longitude: "$_id.longitude",
                    reportCount: 1,
                },
            },
        ]),
        barrier_model_js_1.Barrier.aggregate([
            { $match: { createdAt: { $gte: twelveMonthsAgo } } },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" },
                    },
                    count: { $sum: 1 },
                },
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } },
            {
                $project: {
                    _id: 0,
                    month: {
                        $concat: [
                            { $toString: "$_id.year" },
                            "-",
                            {
                                $cond: [
                                    { $lt: ["$_id.month", 10] },
                                    { $concat: ["0", { $toString: "$_id.month" }] },
                                    { $toString: "$_id.month" },
                                ],
                            },
                        ],
                    },
                    count: 1,
                },
            },
        ]),
        feedback_model_js_1.Feedback.countDocuments(),
        user_model_js_1.User.aggregate([
            {
                $group: {
                    _id: "$role",
                    count: { $sum: 1 },
                },
            },
        ]),
        location_model_js_1.Location.aggregate([
            { $group: { _id: "$submittedBy", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 },
            {
                $project: {
                    _id: 0,
                    userId: { $toString: "$_id" },
                    locationsSubmitted: "$count",
                },
            },
        ]),
        barrier_model_js_1.Barrier.aggregate([
            { $group: { _id: "$reportedBy", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 },
            {
                $project: {
                    _id: 0,
                    userId: { $toString: "$_id" },
                    barriersReported: "$count",
                },
            },
        ]),
    ]);
    const locCounts = {};
    let totalLocations = 0;
    for (const row of locationSummaryAgg) {
        locCounts[row._id] = row.count;
        totalLocations += row.count;
    }
    const barrierCounts = {};
    let totalBarrierReports = 0;
    for (const row of barrierSummaryAgg) {
        barrierCounts[row._id] = row.count;
        totalBarrierReports += row.count;
    }
    return {
        summary: {
            totalLocations,
            verifiedLocations: locCounts[location_types_js_1.VerificationStatus.VERIFIED] ?? 0,
            pendingLocations: locCounts[location_types_js_1.VerificationStatus.PENDING] ?? 0,
            rejectedLocations: locCounts[location_types_js_1.VerificationStatus.REJECTED] ?? 0,
            totalBarrierReports,
            verifiedReports: barrierCounts[barrier_types_js_1.BarrierStatus.VERIFIED] ?? 0,
            pendingReports: barrierCounts[barrier_types_js_1.BarrierStatus.PENDING] ?? 0,
            resolvedReports: barrierCounts[barrier_types_js_1.BarrierStatus.RESOLVED] ?? 0,
            rejectedReports: barrierCounts[barrier_types_js_1.BarrierStatus.REJECTED] ?? 0,
            totalFeedbackRecords,
        },
        accessibilityCategoryDistribution: locationCategoryDist.map((row) => ({
            category: row._id,
            count: row.count,
            avgAccessibilityScore: Math.round((row.avgAccessibilityScore ?? 0) * 10) / 10,
        })),
        barrierCategoryDistribution: barrierCategoryDist.map((row) => ({
            category: row._id,
            count: row.count,
        })),
        mostReportedAreas,
        monthlyReportTrends,
        communityContributionStats: {
            usersByRole: usersByRole.map((r) => ({ role: r._id, count: r.count })),
            topLocationContributors,
            topBarrierReporters,
        },
    };
}
//# sourceMappingURL=admin.service.js.map