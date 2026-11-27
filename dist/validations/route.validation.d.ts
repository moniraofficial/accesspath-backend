import { IRoutePoint, IRoutePreferences } from "../types/route.types.js";
export interface IDiscoverRoutesInput {
    start: IRoutePoint;
    destination: IRoutePoint;
    preferences: IRoutePreferences;
}
export declare function validateDiscoverRoutesInput(data: unknown): IDiscoverRoutesInput;
//# sourceMappingURL=route.validation.d.ts.map