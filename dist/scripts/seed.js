"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("../config/env.js");
const node_dns_1 = __importDefault(require("node:dns"));
const mongoose_1 = __importDefault(require("mongoose"));
const user_model_js_1 = require("../models/user.model.js");
const location_model_js_1 = require("../models/location.model.js");
const barrier_model_js_1 = require("../models/barrier.model.js");
const feedback_model_js_1 = require("../models/feedback.model.js");
const roles_js_1 = require("../config/roles.js");
const password_js_1 = require("../utils/password.js");
const location_types_js_1 = require("../types/location.types.js");
const barrier_types_js_1 = require("../types/barrier.types.js");
const feedback_types_js_1 = require("../types/feedback.types.js");
const location_service_js_1 = require("../services/location.service.js");
const barrier_service_js_1 = require("../services/barrier.service.js");
const route_service_js_1 = require("../services/route.service.js");
const admin_service_js_1 = require("../services/admin.service.js");
node_dns_1.default.setServers(["8.8.8.8", "1.1.1.1"]);
const TARGET_LOCATIONS = 10_000;
const TARGET_BARRIERS = 50_000;
const TARGET_FEEDBACK = 100_000;
const BATCH_SIZE = 5_000;
// Urban bounding box centered around Dhaka (23.70..23.90, 90.35..90.50)
const BASE_LAT = 23.70;
const LAT_SPAN = 0.20;
const BASE_LNG = 90.35;
const LNG_SPAN = 0.15;
function randomCoord() {
    const lat = Number((BASE_LAT + Math.random() * LAT_SPAN).toFixed(6));
    const lng = Number((BASE_LNG + Math.random() * LNG_SPAN).toFixed(6));
    return [lng, lat];
}
function pick(arr, idx) {
    return arr[idx % arr.length];
}
async function seedDemoUsers() {
    const passwordHash = await (0, password_js_1.hashPassword)("DemoPass123!");
    const specs = [
        { name: "Demo Admin", email: "admin@accesspath.demo", role: roles_js_1.UserRole.ADMIN },
        { name: "Demo Moderator", email: "moderator@accesspath.demo", role: roles_js_1.UserRole.MODERATOR },
        { name: "Demo Contributor", email: "contributor@accesspath.demo", role: roles_js_1.UserRole.CONTRIBUTOR },
        { name: "Demo Regular User", email: "user@accesspath.demo", role: roles_js_1.UserRole.REGULAR },
    ];
    const ids = [];
    for (const spec of specs) {
        const doc = await user_model_js_1.User.findOneAndUpdate({ email: spec.email }, {
            $setOnInsert: {
                name: spec.name,
                email: spec.email,
                password: passwordHash,
                role: spec.role,
                isActive: true,
                tokenVersion: 0,
            },
        }, { upsert: true, returnDocument: "after" });
        if (!doc) {
            throw new Error(`Failed to upsert demo user ${spec.email}`);
        }
        ids.push(doc._id);
    }
    return {
        adminId: ids[0],
        moderatorId: ids[1],
        contributorId: ids[2],
        regularId: ids[3],
    };
}
async function seedLocations(contributorId, moderatorId) {
    const existingCount = await location_model_js_1.Location.countDocuments();
    const needed = Math.max(0, TARGET_LOCATIONS - existingCount);
    if (needed > 0) {
        console.log(`Seeding ${needed} locations (existing: ${existingCount})...`);
        const statuses = [
            location_types_js_1.VerificationStatus.VERIFIED,
            location_types_js_1.VerificationStatus.VERIFIED,
            location_types_js_1.VerificationStatus.VERIFIED,
            location_types_js_1.VerificationStatus.PENDING,
            location_types_js_1.VerificationStatus.REJECTED,
        ];
        for (let offset = 0; offset < needed; offset += BATCH_SIZE) {
            const count = Math.min(BATCH_SIZE, needed - offset);
            const batch = [];
            for (let i = 0; i < count; i++) {
                const idx = existingCount + offset + i;
                const category = pick(location_types_js_1.ALL_LOCATION_CATEGORIES, idx);
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
                    location: { type: "Point", coordinates: randomCoord() },
                    category,
                    accessibilityScore: (0, location_service_js_1.calculateAccessibilityScore)(features),
                    accessibilityFeatures: features,
                    photos: [],
                    verificationStatus: status,
                    ...(status === location_types_js_1.VerificationStatus.REJECTED
                        ? { rejectionReason: "Requires updated entrance ramp photo verification." }
                        : {}),
                    submittedBy: contributorId,
                    ...(status !== location_types_js_1.VerificationStatus.PENDING
                        ? { verifiedBy: moderatorId, verifiedAt: new Date() }
                        : {}),
                });
            }
            await location_model_js_1.Location.insertMany(batch, { ordered: false });
            console.log(`  Inserted locations: ${Math.min(offset + count, needed)}/${needed}`);
        }
    }
    else {
        console.log(`Locations already meet target (${existingCount} >= ${TARGET_LOCATIONS}).`);
    }
    const sampleLocations = await location_model_js_1.Location.find().select("_id").limit(1000).lean();
    return sampleLocations.map((l) => l._id);
}
async function seedBarriers(reporterId, moderatorId) {
    const existingCount = await barrier_model_js_1.Barrier.countDocuments();
    const needed = Math.max(0, TARGET_BARRIERS - existingCount);
    if (needed === 0) {
        console.log(`Barriers already meet target (${existingCount} >= ${TARGET_BARRIERS}).`);
        return;
    }
    console.log(`Seeding ${needed} barriers (existing: ${existingCount})...`);
    const statuses = [
        barrier_types_js_1.BarrierStatus.VERIFIED,
        barrier_types_js_1.BarrierStatus.VERIFIED,
        barrier_types_js_1.BarrierStatus.PENDING,
        barrier_types_js_1.BarrierStatus.RESOLVED,
        barrier_types_js_1.BarrierStatus.REJECTED,
    ];
    const nowMs = Date.now();
    for (let offset = 0; offset < needed; offset += BATCH_SIZE) {
        const count = Math.min(BATCH_SIZE, needed - offset);
        const batch = [];
        for (let i = 0; i < count; i++) {
            const idx = existingCount + offset + i;
            const category = pick(barrier_types_js_1.ALL_BARRIER_CATEGORIES, idx);
            const status = pick(statuses, idx);
            const createdAt = new Date(nowMs - (idx % 330) * 24 * 60 * 60 * 1000);
            batch.push({
                category,
                description: `Reported ${category.toLowerCase()} obstacle #${idx + 1} affecting wheelchair and elderly pedestrian mobility.`,
                location: { type: "Point", coordinates: randomCoord() },
                reportedBy: reporterId,
                status,
                ...(status === barrier_types_js_1.BarrierStatus.REJECTED
                    ? { rejectionReason: "Duplicate or resolved barrier report." }
                    : {}),
                ...(status === barrier_types_js_1.BarrierStatus.VERIFIED || status === barrier_types_js_1.BarrierStatus.REJECTED
                    ? { verifiedBy: moderatorId, verifiedAt: createdAt }
                    : {}),
                ...(status === barrier_types_js_1.BarrierStatus.RESOLVED
                    ? { resolvedBy: moderatorId, resolvedAt: createdAt }
                    : {}),
                createdAt,
                updatedAt: createdAt,
            });
        }
        await barrier_model_js_1.Barrier.insertMany(batch, { ordered: false });
        console.log(`  Inserted barriers: ${Math.min(offset + count, needed)}/${needed}`);
    }
}
async function seedFeedback(locationIds, userId) {
    const existingCount = await feedback_model_js_1.Feedback.countDocuments();
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
                locationId: locationIds[idx % locationIds.length],
                userId,
                rating: (idx % 5) + 1,
                comment: `Accessibility visit review #${idx + 1}: verified curb slope, entrance width, and tactile navigation conditions.`,
                status: idx % 25 === 0 ? feedback_types_js_1.FeedbackStatus.HIDDEN : feedback_types_js_1.FeedbackStatus.ACTIVE,
            });
        }
        await feedback_model_js_1.Feedback.insertMany(batch, { ordered: false });
        console.log(`  Inserted feedback: ${Math.min(offset + count, needed)}/${needed}`);
    }
}
async function runBenchmarks() {
    console.log("\n=== PERFORMANCE BENCHMARKS ===");
    const bench = async (label, fn) => {
        const start = performance.now();
        await fn();
        const elapsedMs = (performance.now() - start).toFixed(1);
        console.log(`  ${label}: ${elapsedMs} ms`);
    };
    await bench("Location search + category + wheelchair filter (page 1, limit 20)", () => (0, location_service_js_1.listLocations)({
        page: 1,
        limit: 20,
        category: "Public Buildings",
        verificationStatus: "verified",
        radiusKm: 10,
        sortBy: "accessibilityScore",
        sortOrder: "desc",
        features: { wheelchairAccess: true },
    }));
    await bench("Location geospatial $geoNear query (23.80, 90.42, 5km)", () => (0, location_service_js_1.listLocations)({
        page: 1,
        limit: 20,
        lat: 23.80,
        lng: 90.42,
        radiusKm: 5,
        sortBy: "distance",
        sortOrder: "asc",
        features: {},
    }));
    await bench("Barrier geospatial $geoNear query (23.80, 90.42, 3km)", () => (0, barrier_service_js_1.listBarriers)({
        page: 1,
        limit: 20,
        status: "verified",
        lat: 23.80,
        lng: 90.42,
        radiusKm: 3,
        sortBy: "distance",
        sortOrder: "asc",
    }));
    await bench("Route discovery & accessibility scoring", () => (0, route_service_js_1.discoverAccessibleRoutes)({
        start: { latitude: 23.79, longitude: 90.40 },
        destination: { latitude: 23.81, longitude: 90.43 },
        preferences: { wheelchairFriendly: true, requireRamp: true },
    }));
    await bench("Admin analytics aggregation dashboard", () => (0, admin_service_js_1.getPlatformAnalytics)());
}
async function main() {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
        throw new Error("MONGO_URI is missing in .env");
    }
    await mongoose_1.default.connect(mongoUri, { serverSelectionTimeoutMS: 15000 });
    console.log("Connected to MongoDB Atlas.");
    await Promise.all([
        location_model_js_1.Location.syncIndexes(),
        barrier_model_js_1.Barrier.syncIndexes(),
        feedback_model_js_1.Feedback.syncIndexes(),
    ]);
    const demo = await seedDemoUsers();
    const locationIds = await seedLocations(demo.contributorId, demo.moderatorId);
    await seedBarriers(demo.regularId, demo.moderatorId);
    await seedFeedback(locationIds, demo.regularId);
    const [locCount, barCount, fbCount] = await Promise.all([
        location_model_js_1.Location.countDocuments(),
        barrier_model_js_1.Barrier.countDocuments(),
        feedback_model_js_1.Feedback.countDocuments(),
    ]);
    console.log(`\nFinal collection counts -> Locations: ${locCount}, Barriers: ${barCount}, Feedback: ${fbCount}`);
    await runBenchmarks();
    await mongoose_1.default.disconnect();
}
main().catch(async (err) => {
    console.error("Seed/Benchmark failed:", err);
    await mongoose_1.default.disconnect();
    process.exit(1);
});
//# sourceMappingURL=seed.js.map