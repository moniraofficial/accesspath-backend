import { Types, Document } from "mongoose";
export interface IFavorite {
    userId: Types.ObjectId;
    locationId: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
export interface IFavoriteDocument extends IFavorite, Document {
    _id: Types.ObjectId;
}
export interface IFavoriteResponse {
    id: string;
    userId: string;
    locationId: string;
    createdAt: Date;
}
//# sourceMappingURL=favorite.types.d.ts.map