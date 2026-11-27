import mongoose, { PipelineStage, SortOrder as MongooseSortOrder } from "mongoose";
import { Barrier } from "../models/barrier.model.js";
import { Permissions } from "../config/roles.js";
import { IAuthUser, IPaginationMeta } from "../types/index.js";
import {
  BarrierStatus,
  IBarrierDocument,
  IBarrierResponse,
} from "../types/barrier.types.js";
import {
  IBarrierQuery,
  ICreateBarrierInput,
  IUpdateBarrierInput,
  IVerifyBarrierInput,
} from "../validations/barrier.validation.js";
import {
  assertCanModerateResource,
  assertCanModifyOwnPendingResource,
  hasPermission,
} from "../utils/ownership.js";
import { ApiError } from "../utils/apiError.js";

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function toBarrierResponse(
  doc: IBarrierDocument | (Record<string, any> & { _id: mongoose.Types.ObjectId })
): IBarrierResponse {
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
    isVerified: doc.status === BarrierStatus.VERIFIED,
    ...(doc.rejectionReason !== undefined ? { rejectionReason: doc.rejectionReason } : {}),
    ...(doc.verifiedBy !== undefined ? { verifiedBy: doc.verifiedBy.toString() } : {}),
    ...(doc.verifiedAt !== undefined ? { verifiedAt: doc.verifiedAt } : {}),
    ...(doc.resolvedBy !== undefined ? { resolvedBy: doc.resolvedBy.toString() } : {}),
    ...(doc.resolvedAt !== undefined ? { resolvedAt: doc.resolvedAt } : {}),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function createBarrier(
  input: ICreateBarrierInput,
  currentUser: IAuthUser
): Promise<IBarrierResponse> {
  const canReport =
    hasPermission(currentUser.role, Permissions.REPORT_BARRIERS) ||
    hasPermission(currentUser.role, Permissions.MANAGE_BARRIERS);

  if (!canReport) {
    throw ApiError.forbidden("Access Denied: You do not have permission to report barriers.");
  }

  const created = await Barrier.create({
    category: input.category,
    description: input.description,
    ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl } : {}),
    location: input.location,
    reportedBy: new mongoose.Types.ObjectId(currentUser.id),
    status: BarrierStatus.PENDING,
  });

  return toBarrierResponse(created);
}

export async function listBarriers(
  query: IBarrierQuery
): Promise<{ items: IBarrierResponse[]; meta: IPaginationMeta }> {
  const filter: Record<string, unknown> = {};

  if (query.category) {
    filter.category = query.category;
  }
  if (query.status) {
    filter.status = query.status;
  }
  if (query.reportedBy) {
    filter.reportedBy = new mongoose.Types.ObjectId(query.reportedBy);
  }
  if (query.search) {
    filter.description = new RegExp(escapeRegex(query.search), "i");
  }

  const skip = (query.page - 1) * query.limit;
  const sortDirection: 1 | -1 = query.sortOrder === "asc" ? 1 : -1;

  if (query.lat !== undefined && query.lng !== undefined) {
    const pipeline: PipelineStage[] = [
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
    } else if (sortDirection === -1) {
      pipeline.push({ $sort: { distanceMeters: -1, _id: 1 } });
    }

    pipeline.push({
      $facet: {
        items: [{ $skip: skip }, { $limit: query.limit }],
        totalCount: [{ $count: "count" }],
      },
    });

    const [aggResult] = await Barrier.aggregate(pipeline);
    const rawItems = (aggResult?.items ?? []) as (Record<string, any> & {
      _id: mongoose.Types.ObjectId;
    })[];
    const totalRecords = (aggResult?.totalCount?.[0]?.count as number | undefined) ?? 0;
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

  const sortSpec: Record<string, MongooseSortOrder> = {
    createdAt: sortDirection,
    _id: 1,
  };

  const [docs, totalRecords] = await Promise.all([
    Barrier.find(filter).sort(sortSpec).skip(skip).limit(query.limit).lean(),
    Barrier.countDocuments(filter),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalRecords / query.limit));

  return {
    items: docs.map((d) =>
      toBarrierResponse(d as Record<string, any> & { _id: mongoose.Types.ObjectId })
    ),
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

export async function getBarrierById(barrierId: string): Promise<IBarrierResponse> {
  const barrier = await Barrier.findById(barrierId).lean();
  if (!barrier) {
    throw ApiError.notFound("Barrier report not found.");
  }
  return toBarrierResponse(
    barrier as Record<string, any> & { _id: mongoose.Types.ObjectId }
  );
}

export async function updateBarrier(
  barrierId: string,
  updates: IUpdateBarrierInput,
  currentUser: IAuthUser
): Promise<IBarrierResponse> {
  const barrier = await Barrier.findById(barrierId);
  if (!barrier) {
    throw ApiError.notFound("Barrier report not found.");
  }

  if (!hasPermission(currentUser.role, Permissions.MANAGE_BARRIERS)) {
    assertCanModifyOwnPendingResource(
      barrier.reportedBy,
      barrier.status,
      currentUser,
      "barrier report"
    );
  }

  if (updates.category !== undefined) barrier.category = updates.category;
  if (updates.description !== undefined) barrier.description = updates.description;
  if (updates.imageUrl !== undefined) barrier.imageUrl = updates.imageUrl;
  if (updates.location !== undefined) barrier.location = updates.location;

  const saved = await barrier.save();
  return toBarrierResponse(saved);
}

export async function deleteBarrier(
  barrierId: string,
  currentUser: IAuthUser
): Promise<{ id: string }> {
  const barrier = await Barrier.findById(barrierId);
  if (!barrier) {
    throw ApiError.notFound("Barrier report not found.");
  }

  if (!hasPermission(currentUser.role, Permissions.MANAGE_BARRIERS)) {
    assertCanModifyOwnPendingResource(
      barrier.reportedBy,
      barrier.status,
      currentUser,
      "barrier report"
    );
  }

  await barrier.deleteOne();
  return { id: barrierId };
}

export async function verifyBarrier(
  barrierId: string,
  input: IVerifyBarrierInput,
  currentUser: IAuthUser
): Promise<IBarrierResponse> {
  const barrier = await Barrier.findById(barrierId);
  if (!barrier) {
    throw ApiError.notFound("Barrier report not found.");
  }

  assertCanModerateResource(
    currentUser,
    barrier.reportedBy,
    Permissions.VERIFY_BARRIERS,
    "barrier report"
  );

  barrier.status = input.status;
  const moderatorObjectId = new mongoose.Types.ObjectId(currentUser.id);
  const now = new Date();

  if (input.status === BarrierStatus.RESOLVED) {
    barrier.resolvedBy = moderatorObjectId;
    barrier.resolvedAt = now;
    barrier.set("rejectionReason", undefined);
  } else if (input.status === BarrierStatus.REJECTED) {
    barrier.verifiedBy = moderatorObjectId;
    barrier.verifiedAt = now;
    if (input.rejectionReason) {
      barrier.rejectionReason = input.rejectionReason;
    }
  } else {
    barrier.verifiedBy = moderatorObjectId;
    barrier.verifiedAt = now;
    barrier.set("rejectionReason", undefined);
  }

  const saved = await barrier.save();
  return toBarrierResponse(saved);
}
