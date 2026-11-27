"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALL_VERIFICATION_STATUSES = exports.VerificationStatus = exports.ALL_LOCATION_CATEGORIES = exports.LocationCategory = void 0;
exports.LocationCategory = {
    PUBLIC_BUILDINGS: "Public Buildings",
    PARKS: "Parks",
    EDUCATIONAL_INSTITUTIONS: "Educational Institutions",
    TRANSPORTATION_FACILITIES: "Transportation Facilities",
    GOVERNMENT_OFFICES: "Government Offices",
    COMMUNITY_CENTERS: "Community Centers",
};
exports.ALL_LOCATION_CATEGORIES = [
    exports.LocationCategory.PUBLIC_BUILDINGS,
    exports.LocationCategory.PARKS,
    exports.LocationCategory.EDUCATIONAL_INSTITUTIONS,
    exports.LocationCategory.TRANSPORTATION_FACILITIES,
    exports.LocationCategory.GOVERNMENT_OFFICES,
    exports.LocationCategory.COMMUNITY_CENTERS,
];
exports.VerificationStatus = {
    PENDING: "pending",
    VERIFIED: "verified",
    REJECTED: "rejected",
};
exports.ALL_VERIFICATION_STATUSES = [
    exports.VerificationStatus.PENDING,
    exports.VerificationStatus.VERIFIED,
    exports.VerificationStatus.REJECTED,
];
//# sourceMappingURL=location.types.js.map