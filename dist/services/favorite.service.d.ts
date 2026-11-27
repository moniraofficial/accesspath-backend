import { IAuthUser, IPaginationMeta } from "../types/index.js";
import { IFavoriteResponse } from "../types/favorite.types.js";
import { ILocationResponse } from "../types/location.types.js";
export interface IFavoriteWithLocation {
    favoriteId: string;
    savedAt: Date;
    location: ILocationResponse;
}
export declare function addFavorite(locationId: string, currentUser: IAuthUser): Promise<IFavoriteResponse>;
export declare function removeFavorite(locationId: string, currentUser: IAuthUser): Promise<{
    locationId: string;
}>;
export declare function listFavorites(currentUser: IAuthUser, page: number, limit: number): Promise<{
    items: IFavoriteWithLocation[];
    meta: IPaginationMeta;
}>;
//# sourceMappingURL=favorite.service.d.ts.map