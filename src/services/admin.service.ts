import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { RefreshToken } from "../models/refresh-token.model.js";
import { Location } from "../models/location.model.js";
import { Barrier } from "../models/barrier.model.js";
import { Feedback } from "../models/feedback.model.js";
import { IAuthUser, IPaginationMeta, IUserDocument, IUserResponse } from "../types/index.js";
import { BarrierStatus } from "../types/barrier.types.js";
import { VerificationStatus } from "../types/location.types.js";
import { IAdminUpdateUserInput, IAdminUsersQuery } from "../validations/admin.validation.js";
import { toUserResponse } from "./auth.service.js";
import { ApiError } from "../utils/apiError.js";

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function listUsersForAdmin(
  query: IAdminUsersQuery
): Promise<{ items: IUserResponse[]; meta: IPaginationMeta }> {
  const filter: Record<string, unknown> = {};
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
    User.find(filter).sort({ createdAt: -1, _id: 1 }).skip(skip).limit(query.limit),
    User.countDocuments(filter),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalRecords / query.limit));

  return {
    items: docs.map((u) => toUserResponse(u as IUserDocument)),
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

export async function updateUserByAdmin(
  targetUserId: string,
  updates: IAdminUpdateUserInput,
  currentAdmin: IAuthUser
): Promise<IUserResponse> {
  if (targetUserId === currentAdmin.id) {
    if (updates.isActive === false || (updates.role && updates.role !== currentAdmin.role)) {
      throw ApiError.badRequest("Admins cannot deactivate or demote their own account.");
    }
  }

  const user = await User.findById(targetUserId);
  if (!user) {
    throw ApiError.notFound("User account not found.");
  }

  const sessionRevocationNeeded =
    (updates.role !== undefined && updates.role !== user.role) ||
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
    await RefreshToken.updateMany(
      { userId: new mongoose.Types.ObjectId(targetUserId), isRevoked: false },
      { $set: { isRevoked: true } }
    );
  }

  return toUserResponse(saved);
}

export async function getPlatformAnalytics() {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setUTCMonth(twelveMonthsAgo.getUTCMonth() - 11);
  twelveMonthsAgo.setUTCDate(1);
  twelveMonthsAgo.setUTCHours(0, 0, 0, 0);

  const [
    locationSummaryAgg,
    locationCategoryDist,
    barrierSummaryAgg,
    barrierCategoryDist,
    mostReportedAreas,
    monthlyReportTrends,
    totalFeedbackRecords,
    usersByRole,
    topLocationContributors,
    topBarrierReporters,
  ] = await Promise.all([
    Location.aggregate([
      {
        $group: {
          _id: "$verificationStatus",
          count: { $sum: 1 },
        },
      },
    ]),
    Location.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          avgAccessibilityScore: { $avg: "$accessibilityScore" },
        },
      },
      { $sort: { count: -1 } },
    ]),
    Barrier.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]),
    Barrier.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]),
    Barrier.aggregate([
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
    Barrier.aggregate([
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
    Feedback.countDocuments(),
    User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
        },
      },
    ]),
    Location.aggregate([
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
    Barrier.aggregate([
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

  const locCounts: Record<string, number> = {};
  let totalLocations = 0;
  for (const row of locationSummaryAgg) {
    locCounts[row._id as string] = row.count as number;
    totalLocations += row.count as number;
  }

  const barrierCounts: Record<string, number> = {};
  let totalBarrierReports = 0;
  for (const row of barrierSummaryAgg) {
    barrierCounts[row._id as string] = row.count as number;
    totalBarrierReports += row.count as number;
  }

  return {
    summary: {
      totalLocations,
      verifiedLocations: locCounts[VerificationStatus.VERIFIED] ?? 0,
      pendingLocations: locCounts[VerificationStatus.PENDING] ?? 0,
      rejectedLocations: locCounts[VerificationStatus.REJECTED] ?? 0,
      totalBarrierReports,
      verifiedReports: barrierCounts[BarrierStatus.VERIFIED] ?? 0,
      pendingReports: barrierCounts[BarrierStatus.PENDING] ?? 0,
      resolvedReports: barrierCounts[BarrierStatus.RESOLVED] ?? 0,
      rejectedReports: barrierCounts[BarrierStatus.REJECTED] ?? 0,
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
