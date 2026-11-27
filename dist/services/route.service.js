"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.haversineDistanceMeters = haversineDistanceMeters;
exports.discoverAccessibleRoutes = discoverAccessibleRoutes;
const barrier_model_js_1 = require("../models/barrier.model.js");
const location_model_js_1 = require("../models/location.model.js");
const barrier_types_js_1 = require("../types/barrier.types.js");
const location_types_js_1 = require("../types/location.types.js");
const EARTH_RADIUS_METERS = 6_371_000;
const WALK_SPEED_METERS_PER_MIN = 70; // ~4.2 km/h accessible walking/wheelchair pace
const CORRIDOR_BARRIER_RADIUS_METERS = 150;
const CORRIDOR_FACILITY_RADIUS_METERS = 200;
const BARRIER_PENALTIES = {
    [barrier_types_js_1.BarrierCategory.BROKEN_FOOTPATH]: 20,
    [barrier_types_js_1.BarrierCategory.MISSING_RAMP]: 22,
    [barrier_types_js_1.BarrierCategory.BLOCKED_SIDEWALK]: 25,
    [barrier_types_js_1.BarrierCategory.BROKEN_ELEVATOR]: 22,
    [barrier_types_js_1.BarrierCategory.UNSAFE_CROSSING]: 20,
};
function toRadians(deg) {
    return (deg * Math.PI) / 180;
}
/**
 * Computes Haversine great-circle distance in meters between two GPS points.
 */
function haversineDistanceMeters(a, b) {
    const dLat = toRadians(b.latitude - a.latitude);
    const dLng = toRadians(b.longitude - a.longitude);
    const lat1 = toRadians(a.latitude);
    const lat2 = toRadians(b.latitude);
    const sinDLat = Math.sin(dLat / 2);
    const sinDLng = Math.sin(dLng / 2);
    const h = sinDLat * sinDLat +
        Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
    return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(h)));
}
/**
 * Computes minimum distance in meters from point P to segment AB using local equirectangular projection.
 */
function pointToSegmentDistanceMeters(p, a, b) {
    const midLatRad = toRadians((a.latitude + b.latitude) / 2);
    const metersPerDegLat = 111_132;
    const metersPerDegLng = 111_320 * Math.cos(midLatRad);
    const ax = (a.longitude - p.longitude) * metersPerDegLng;
    const ay = (a.latitude - p.latitude) * metersPerDegLat;
    const bx = (b.longitude - p.longitude) * metersPerDegLng;
    const by = (b.latitude - p.latitude) * metersPerDegLat;
    const dx = bx - ax;
    const dy = by - ay;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) {
        return Math.hypot(ax, ay);
    }
    const t = Math.max(0, Math.min(1, -(ax * dx + ay * dy) / lenSq));
    const projX = ax + t * dx;
    const projY = ay + t * dy;
    return Math.hypot(projX, projY);
}
function minDistanceToRouteMeters(point, waypoints) {
    let min = Infinity;
    for (let i = 0; i < waypoints.length - 1; i++) {
        const a = waypoints[i];
        const b = waypoints[i + 1];
        if (a && b) {
            const dist = pointToSegmentDistanceMeters(point, a, b);
            if (dist < min) {
                min = dist;
            }
        }
    }
    return min;
}
function computeRouteDistanceMeters(waypoints) {
    let total = 0;
    for (let i = 0; i < waypoints.length - 1; i++) {
        const a = waypoints[i];
        const b = waypoints[i + 1];
        if (a && b) {
            total += haversineDistanceMeters(a, b);
        }
    }
    return Math.round(total);
}
function buildOffsetWaypoint(start, dest, offsetFactor) {
    const midLat = (start.latitude + dest.latitude) / 2;
    const midLng = (start.longitude + dest.longitude) / 2;
    const dLat = dest.latitude - start.latitude;
    const dLng = dest.longitude - start.longitude;
    const norm = Math.hypot(dLat, dLng) || 0.001;
    // Perpendicular offset proportional to segment length (capped between ~150m and ~800m)
    const magnitude = Math.max(0.0015, Math.min(0.008, norm * 0.25)) * offsetFactor;
    const perpLat = (-dLng / norm) * magnitude;
    const perpLng = (dLat / norm) * magnitude;
    return {
        latitude: Math.max(-90, Math.min(90, midLat + perpLat)),
        longitude: Math.max(-180, Math.min(180, midLng + perpLng)),
    };
}
async function discoverAccessibleRoutes(input) {
    const { start, destination, preferences } = input;
    const minLat = Math.max(-90, Math.min(start.latitude, destination.latitude) - 0.02);
    const maxLat = Math.min(90, Math.max(start.latitude, destination.latitude) + 0.02);
    const minLng = Math.max(-180, Math.min(start.longitude, destination.longitude) - 0.02);
    const maxLng = Math.min(180, Math.max(start.longitude, destination.longitude) + 0.02);
    const boundingBoxFilter = {
        location: {
            $geoWithin: {
                $box: [
                    [minLng, minLat],
                    [maxLng, maxLat],
                ],
            },
        },
    };
    const [barriers, verifiedLocations] = await Promise.all([
        barrier_model_js_1.Barrier.find({
            ...boundingBoxFilter,
            status: { $in: [barrier_types_js_1.BarrierStatus.VERIFIED, barrier_types_js_1.BarrierStatus.PENDING] },
        })
            .select("category description status location")
            .limit(500)
            .lean(),
        location_model_js_1.Location.find({
            ...boundingBoxFilter,
            verificationStatus: location_types_js_1.VerificationStatus.VERIFIED,
        })
            .select("name location accessibilityScore accessibilityFeatures")
            .sort({ accessibilityScore: -1 })
            .limit(100)
            .lean(),
    ]);
    const candidates = [
        {
            routeId: "direct-corridor",
            name: "Direct Corridor",
            waypoints: [start, destination],
        },
        {
            routeId: "north-accessible-detour",
            name: "Northern Accessible Detour",
            waypoints: [start, buildOffsetWaypoint(start, destination, 1), destination],
        },
        {
            routeId: "south-accessible-detour",
            name: "Southern Accessible Detour",
            waypoints: [start, buildOffsetWaypoint(start, destination, -1), destination],
        },
    ];
    // Add a hub-assisted route through the highest-scoring verified accessible location if available
    const topFacility = verifiedLocations.find((loc) => loc.accessibilityFeatures?.wheelchairAccess &&
        (loc.accessibilityFeatures?.rampAvailability || loc.accessibilityFeatures?.stairFreeEntry));
    if (topFacility && Array.isArray(topFacility.location?.coordinates)) {
        const [lng, lat] = topFacility.location.coordinates;
        if (typeof lat === "number" && typeof lng === "number") {
            candidates.push({
                routeId: "verified-hub-route",
                name: `Via Accessible Hub (${topFacility.name})`,
                waypoints: [start, { latitude: lat, longitude: lng }, destination],
            });
        }
    }
    const distances = candidates.map((c) => computeRouteDistanceMeters(c.waypoints));
    const minDistance = Math.max(1, Math.min(...distances));
    const scoredRoutes = candidates.map((candidate, idx) => {
        const distanceMeters = distances[idx] ?? 0;
        const estimatedTravelMinutes = Math.max(1, Math.round(distanceMeters / WALK_SPEED_METERS_PER_MIN));
        let score = 75;
        const warnings = [];
        const positiveFeaturesSet = new Set();
        const routeBarriers = [];
        // Distance score impact (shorter distance gives positive boost, detours incur mild penalty)
        const distanceRatio = distanceMeters / minDistance;
        if (distanceRatio <= 1.05) {
            score += 10;
        }
        else {
            score -= Math.min(10, Math.round((distanceRatio - 1) * 15));
        }
        // Positive accessibility features from nearby verified locations
        let hasRamp = false;
        let hasElevator = false;
        let hasStairFree = false;
        for (const loc of verifiedLocations) {
            const coords = loc.location?.coordinates;
            if (!coords || coords.length !== 2)
                continue;
            const point = { latitude: coords[1], longitude: coords[0] };
            if (minDistanceToRouteMeters(point, candidate.waypoints) <= CORRIDOR_FACILITY_RADIUS_METERS) {
                if (loc.accessibilityFeatures?.rampAvailability)
                    hasRamp = true;
                if (loc.accessibilityFeatures?.elevatorAvailability)
                    hasElevator = true;
                if (loc.accessibilityFeatures?.stairFreeEntry)
                    hasStairFree = true;
            }
        }
        if (hasRamp) {
            score += 8;
            positiveFeaturesSet.add("Verified Ramp Available");
        }
        if (hasElevator) {
            score += 8;
            positiveFeaturesSet.add("Verified Elevator Available");
        }
        if (hasStairFree) {
            score += 6;
            positiveFeaturesSet.add("Stair-free Corridor Facilities");
        }
        if (preferences.requireRamp && !hasRamp) {
            score -= 8;
            warnings.push("No verified ramp facility detected along this corridor.");
        }
        if (preferences.requireElevator && !hasElevator) {
            score -= 8;
            warnings.push("No verified elevator facility detected along this corridor.");
        }
        // Barrier penalties along the corridor
        for (const b of barriers) {
            const coords = b.location?.coordinates;
            if (!coords || coords.length !== 2)
                continue;
            const bPoint = { latitude: coords[1], longitude: coords[0] };
            const distToRoute = Math.round(minDistanceToRouteMeters(bPoint, candidate.waypoints));
            if (distToRoute <= CORRIDOR_BARRIER_RADIUS_METERS) {
                const isVerified = b.status === barrier_types_js_1.BarrierStatus.VERIFIED;
                const basePenalty = BARRIER_PENALTIES[b.category] ?? 18;
                let penalty = isVerified ? basePenalty : Math.round(basePenalty * 0.5);
                if (preferences.wheelchairFriendly && b.category === barrier_types_js_1.BarrierCategory.MISSING_RAMP) {
                    penalty += 8;
                }
                if (preferences.avoidUnverified && !isVerified) {
                    penalty += 5;
                }
                score -= penalty;
                routeBarriers.push({
                    id: b._id.toString(),
                    category: b.category,
                    description: b.description,
                    status: b.status,
                    isVerified,
                    coordinates: bPoint,
                    distanceFromRouteMeters: distToRoute,
                });
                warnings.push(isVerified
                    ? `Verified ${b.category} (${distToRoute}m from route): ${b.description}`
                    : `Unverified ${b.category} pending moderation (${distToRoute}m from route)`);
            }
        }
        const clampedScore = Math.max(0, Math.min(100, Math.round(score)));
        return {
            routeId: candidate.routeId,
            name: candidate.name,
            waypoints: candidate.waypoints,
            distanceMeters,
            estimatedTravelMinutes,
            accessibilityScore: clampedScore,
            isRecommended: false,
            barriers: routeBarriers,
            warnings,
            positiveFeatures: Array.from(positiveFeaturesSet),
        };
    });
    // Rank primarily by accessibilityScore DESC, then distanceMeters ASC
    scoredRoutes.sort((a, b) => {
        if (b.accessibilityScore !== a.accessibilityScore) {
            return b.accessibilityScore - a.accessibilityScore;
        }
        return a.distanceMeters - b.distanceMeters;
    });
    if (scoredRoutes[0]) {
        scoredRoutes[0].isRecommended = true;
    }
    return {
        start,
        destination,
        routes: scoredRoutes,
    };
}
//# sourceMappingURL=route.service.js.map