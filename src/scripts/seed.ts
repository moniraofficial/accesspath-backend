import "../config/env.js";
import dns from "node:dns";
import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { Location } from "../models/location.model.js";
import { Barrier } from "../models/barrier.model.js";
import { Feedback } from "../models/feedback.model.js";
import { UserRole } from "../config/roles.js";
import { hashPassword } from "../utils/password.js";
import {
  ALL_LOCATION_CATEGORIES,
  VerificationStatus,
} from "../types/location.types.js";
import {
  ALL_BARRIER_CATEGORIES,
  BarrierStatus,
} from "../types/barrier.types.js";
import { FeedbackStatus } from "../types/feedback.types.js";
import {
  calculateAccessibilityScore,
  listLocations,
} from "../services/location.service.js";
import { listBarriers } from "../services/barrier.service.js";
import { discoverAccessibleRoutes } from "../services/route.service.js";
import { getPlatformAnalytics } from "../services/admin.service.js";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const TARGET_LOCATIONS = 10_000;
const TARGET_BARRIERS = 50_000;
const TARGET_FEEDBACK = 100_000;
const BATCH_SIZE = 5_000;

// Urban bounding box centered around Dhaka (23.70..23.90, 90.35..90.50)
const BASE_LAT = 23.70;
const LAT_SPAN = 0.20;
const BASE_LNG = 90.35;
const LNG_SPAN = 0.15;

function randomCoord(): [number, number] {
  const lat = Number((BASE_LAT + Math.random() * LAT_SPAN).toFixed(6));
  const lng = Number((BASE_LNG + Math.random() * LNG_SPAN).toFixed(6));
  return [lng, lat];
}

function pick<T>(arr: readonly T[], idx: number): T {
  return arr[idx % arr.length] as T;
}

async function seedDemoUsers(): Promise<{
  adminId: mongoose.Types.ObjectId;
  moderatorId: mongoose.Types.ObjectId;
  contributorId: mongoose.Types.ObjectId;
  regularId: mongoose.Types.ObjectId;
}> {
  const passwordHash = await hashPassword("DemoPass123!");

  const specs = [
    { name: "Demo Admin", email: "admin@accesspath.demo", role: UserRole.ADMIN },
    { name: "Demo Moderator", email: "moderator@accesspath.demo", role: UserRole.MODERATOR },
    { name: "Demo Contributor", email: "contributor@accesspath.demo", role: UserRole.CONTRIBUTOR },
    { name: "Demo Regular User", email: "user@accesspath.demo", role: UserRole.REGULAR },
  ] as const;

  const ids: mongoose.Types.ObjectId[] = [];
  for (const spec of specs) {
    const doc = await User.findOneAndUpdate(
      { email: spec.email },
      {
        $setOnInsert: {
          name: spec.name,
          email: spec.email,
          password: passwordHash,
          role: spec.role,
          isActive: true,
          tokenVersion: 0,
        },
      },
      { upsert: true, returnDocument: "after" }
    );
    if (!doc) {
      throw new Error(`Failed to upsert demo user ${spec.email}`);
    }
    ids.push(doc._id);
  }

  return {
    adminId: ids[0]!,
    moderatorId: ids[1]!,
    contributorId: ids[2]!,
    regularId: ids[3]!,
  };
}

async function seedLocations(
  contributorId: mongoose.Types.ObjectId,
  moderatorId: mongoose.Types.ObjectId
): Promise<mongoose.Types.ObjectId[]> {
  const existingCount = await Location.countDocuments();
  const needed = Math.max(0, TARGET_LOCATIONS - existingCount);

  if (needed > 0) {
    console.log(`Seeding ${needed} locations (existing: ${existingCount})...`);
    const statuses = [
      VerificationStatus.VERIFIED,
      VerificationStatus.VERIFIED,
      VerificationStatus.VERIFIED,
      VerificationStatus.PENDING,
      VerificationStatus.REJECTED,
    ] as const;

    for (let offset = 0; offset < needed; offset += BATCH_SIZE) {
      const count = Math.min(BATCH_SIZE, needed - offset);
      const batch = [];
      for (let i = 0; i < count; i++) {
        const idx = existingCount + offset + i;
        const category = pick(ALL_LOCATION_CATEGORIES, idx);
        const status = pick(statuses, idx);
        const features = {
          wheelchairAccess: idx % 5 !== 0,
          rampAvailability: idx % 3 !== 0,
          elevatorAvailability: idx % 2 === 0,
          accessibleRestroom: idx % 4 !== 0,
          accessibleParking: idx % 3 === 0,
          stairFreeEntry: idx % 4 !== 1,
          doorAccessibility: idx % 2 === 1,
        };
        batch.push({
          name: `${category} Hub #${idx + 1}`,
          description: `Urban accessibility site #${idx + 1} in ${category} category with documented entrance and mobility attributes.`,
          address: `${10 + (idx % 900)} AccessPath Avenue, Sector ${(idx % 25) + 1}`,
          location: { type: "Point" as const, coordinates: randomCoord() },
          category,
          accessibilityScore: calculateAccessibilityScore(features),
          accessibilityFeatures: features,
          photos: [],
          verificationStatus: status,
          ...(status === VerificationStatus.REJECTED
            ? { rejectionReason: "Requires updated entrance ramp photo verification." }
            : {}),
          submittedBy: contributorId,
          ...(status !== VerificationStatus.PENDING
            ? { verifiedBy: moderatorId, verifiedAt: new Date() }
            : {}),
        });
      }
      await Location.insertMany(batch, { ordered: false });
      console.log(`  Inserted locations: ${Math.min(offset + count, needed)}/${needed}`);
    }
  } else {
    console.log(`Locations already meet target (${existingCount} >= ${TARGET_LOCATIONS}).`);
  }

  const sampleLocations = await Location.find().select("_id").limit(1000).lean();
  return sampleLocations.map((l) => l._id as mongoose.Types.ObjectId);
}

async function seedBarriers(
  reporterId: mongoose.Types.ObjectId,
  moderatorId: mongoose.Types.ObjectId
): Promise<void> {
  const existingCount = await Barrier.countDocuments();
  const needed = Math.max(0, TARGET_BARRIERS - existingCount);

  if (needed === 0) {
    console.log(`Barriers already meet target (${existingCount} >= ${TARGET_BARRIERS}).`);
    return;
  }

  console.log(`Seeding ${needed} barriers (existing: ${existingCount})...`);
  const statuses = [
    BarrierStatus.VERIFIED,
    BarrierStatus.VERIFIED,
    BarrierStatus.PENDING,
    BarrierStatus.RESOLVED,
    BarrierStatus.REJECTED,
  ] as const;

  const nowMs = Date.now();
  for (let offset = 0; offset < needed; offset += BATCH_SIZE) {
    const count = Math.min(BATCH_SIZE, needed - offset);
    const batch = [];
    for (let i = 0; i < count; i++) {
      const idx = existingCount + offset + i;
      const category = pick(ALL_BARRIER_CATEGORIES, idx);
      const status = pick(statuses, idx);
      const createdAt = new Date(nowMs - (idx % 330) * 24 * 60 * 60 * 1000);
      batch.push({
        category,
        description: `Reported ${category.toLowerCase()} obstacle #${idx + 1} affecting wheelchair and elderly pedestrian mobility.`,
        location: { type: "Point" as const, coordinates: randomCoord() },
        reportedBy: reporterId,
        status,
        ...(status === BarrierStatus.REJECTED
          ? { rejectionReason: "Duplicate or resolved barrier report." }
          : {}),
        ...(status === BarrierStatus.VERIFIED || status === BarrierStatus.REJECTED
          ? { verifiedBy: moderatorId, verifiedAt: createdAt }
          : {}),
        ...(status === BarrierStatus.RESOLVED
          ? { resolvedBy: moderatorId, resolvedAt: createdAt }
          : {}),
        createdAt,
        updatedAt: createdAt,
      });
    }
    await Barrier.insertMany(batch, { ordered: false });
    console.log(`  Inserted barriers: ${Math.min(offset + count, needed)}/${needed}`);
  }
}

async function seedFeedback(
  locationIds: mongoose.Types.ObjectId[],
  userId: mongoose.Types.ObjectId
): Promise<void> {
  const existingCount = await Feedback.countDocuments();
  const needed = Math.max(0, TARGET_FEEDBACK - existingCount);

  if (needed === 0) {
    console.log(`Feedback already meets target (${existingCount} >= ${TARGET_FEEDBACK}).`);
    return;
  }

  if (locationIds.length === 0) {
    throw new Error("Cannot seed feedback without location IDs.");
  }

  console.log(`Seeding ${needed} feedback records (existing: ${existingCount})...`);
  for (let offset = 0; offset < needed; offset += BATCH_SIZE) {
    const count = Math.min(BATCH_SIZE, needed - offset);
    const batch = [];
    for (let i = 0; i < count; i++) {
      const idx = existingCount + offset + i;
      batch.push({
        locationId: locationIds[idx % locationIds.length]!,
        userId,
        rating: (idx % 5) + 1,
        comment: `Accessibility visit review #${idx + 1}: verified curb slope, entrance width, and tactile navigation conditions.`,
        status: idx % 25 === 0 ? FeedbackStatus.HIDDEN : FeedbackStatus.ACTIVE,
      });
    }
    await Feedback.insertMany(batch, { ordered: false });
    console.log(`  Inserted feedback: ${Math.min(offset + count, needed)}/${needed}`);
  }
}

async function runBenchmarks(): Promise<void> {
  console.log("\n=== PERFORMANCE BENCHMARKS ===");

  const bench = async (label: string, fn: () => Promise<unknown>) => {
    const start = performance.now();
    await fn();
    const elapsedMs = (performance.now() - start).toFixed(1);
    console.log(`  ${label}: ${elapsedMs} ms`);
  };

  await bench("Location search + category + wheelchair filter (page 1, limit 20)", () =>
    listLocations({
      page: 1,
      limit: 20,
      category: "Public Buildings",
      verificationStatus: "verified",
      radiusKm: 10,
      sortBy: "accessibilityScore",
      sortOrder: "desc",
      features: { wheelchairAccess: true },
    })
  );

  await bench("Location geospatial $geoNear query (23.80, 90.42, 5km)", () =>
    listLocations({
      page: 1,
      limit: 20,
      lat: 23.80,
      lng: 90.42,
      radiusKm: 5,
      sortBy: "distance",
      sortOrder: "asc",
      features: {},
    })
  );

  await bench("Barrier geospatial $geoNear query (23.80, 90.42, 3km)", () =>
    listBarriers({
      page: 1,
      limit: 20,
      status: "verified",
      lat: 23.80,
      lng: 90.42,
      radiusKm: 3,
      sortBy: "distance",
      sortOrder: "asc",
    })
  );

  await bench("Route discovery & accessibility scoring", () =>
    discoverAccessibleRoutes({
      start: { latitude: 23.79, longitude: 90.40 },
      destination: { latitude: 23.81, longitude: 90.43 },
      preferences: { wheelchairFriendly: true, requireRamp: true },
    })
  );

  await bench("Admin analytics aggregation dashboard", () => getPlatformAnalytics());
}

async function main(): Promise<void> {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("MONGO_URI is missing in .env");
  }

  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 15000 });
  console.log("Connected to MongoDB Atlas.");

  await Promise.all([
    Location.syncIndexes(),
    Barrier.syncIndexes(),
    Feedback.syncIndexes(),
  ]);

  const demo = await seedDemoUsers();
  const locationIds = await seedLocations(demo.contributorId, demo.moderatorId);
  await seedBarriers(demo.regularId, demo.moderatorId);
  await seedFeedback(locationIds, demo.regularId);

  const [locCount, barCount, fbCount] = await Promise.all([
    Location.countDocuments(),
    Barrier.countDocuments(),
    Feedback.countDocuments(),
  ]);
  console.log(`\nFinal collection counts -> Locations: ${locCount}, Barriers: ${barCount}, Feedback: ${fbCount}`);

  await runBenchmarks();
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error("Seed/Benchmark failed:", err);
  await mongoose.disconnect();
  process.exit(1);
});
