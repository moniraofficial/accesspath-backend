import { IRouteDiscoveryResult, IRoutePoint } from "../types/route.types.js";
import { IDiscoverRoutesInput } from "../validations/route.validation.js";
/**
 * Computes Haversine great-circle distance in meters between two GPS points.
 */
export declare function haversineDistanceMeters(a: IRoutePoint, b: IRoutePoint): number;
export declare function discoverAccessibleRoutes(input: IDiscoverRoutesInput): Promise<IRouteDiscoveryResult>;
//# sourceMappingURL=route.service.d.ts.map