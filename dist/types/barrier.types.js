"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALL_BARRIER_STATUSES = exports.BarrierStatus = exports.ALL_BARRIER_CATEGORIES = exports.BarrierCategory = void 0;
exports.BarrierCategory = {
    BROKEN_FOOTPATH: "Broken Footpath",
    MISSING_RAMP: "Missing Ramp",
    BLOCKED_SIDEWALK: "Blocked Sidewalk",
    BROKEN_ELEVATOR: "Broken Elevator",
    UNSAFE_CROSSING: "Unsafe Crossing",
};
exports.ALL_BARRIER_CATEGORIES = [
    exports.BarrierCategory.BROKEN_FOOTPATH,
    exports.BarrierCategory.MISSING_RAMP,
    exports.BarrierCategory.BLOCKED_SIDEWALK,
    exports.BarrierCategory.BROKEN_ELEVATOR,
    exports.BarrierCategory.UNSAFE_CROSSING,
];
exports.BarrierStatus = {
    PENDING: "pending",
    VERIFIED: "verified",
    REJECTED: "rejected",
    RESOLVED: "resolved",
};
exports.ALL_BARRIER_STATUSES = [
    exports.BarrierStatus.PENDING,
    exports.BarrierStatus.VERIFIED,
    exports.BarrierStatus.REJECTED,
    exports.BarrierStatus.RESOLVED,
];
//# sourceMappingURL=barrier.types.js.map