import { BarrierCategoryType, BarrierStatusType } from "./barrier.types.js";
export interface IRoutePoint {
    latitude: number;
    longitude: number;
}
export interface IRoutePreferences {
    wheelchairFriendly?: boolean;
    requireRamp?: boolean;
    requireElevator?: boolean;
    avoidUnverified?: boolean;
}
export interface IRouteBarrierSummary {
    id: string;
    category: BarrierCategoryType;
    description: string;
    status: BarrierStatusType;
    isVerified: boolean;
    coordinates: IRoutePoint;
    distanceFromRouteMeters: number;
}
export interface IRouteOption {
    routeId: string;
    name: string;
    waypoints: IRoutePoint[];
    distanceMeters: number;
    estimatedTravelMinutes: number;
    accessibilityScore: number;
    isRecommended: boolean;
    barriers: IRouteBarrierSummary[];
    warnings: string[];
    positiveFeatures: string[];
}
export interface IRouteDiscoveryResult {
    start: IRoutePoint;
    destination: IRoutePoint;
    routes: IRouteOption[];
}
//# sourceMappingURL=route.types.d.ts.map