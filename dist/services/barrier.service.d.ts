import mongoose from "mongoose";
import { IAuthUser, IPaginationMeta } from "../types/index.js";
import { IBarrierDocument, IBarrierResponse } from "../types/barrier.types.js";
import { IBarrierQuery, ICreateBarrierInput, IUpdateBarrierInput, IVerifyBarrierInput } from "../validations/barrier.validation.js";
export declare function toBarrierResponse(doc: IBarrierDocument | (Record<string, any> & {
    _id: mongoose.Types.ObjectId;
})): IBarrierResponse;
export declare function createBarrier(input: ICreateBarrierInput, currentUser: IAuthUser): Promise<IBarrierResponse>;
export declare function listBarriers(query: IBarrierQuery): Promise<{
    items: IBarrierResponse[];
    meta: IPaginationMeta;
}>;
export declare function getBarrierById(barrierId: string): Promise<IBarrierResponse>;
export declare function updateBarrier(barrierId: string, updates: IUpdateBarrierInput, currentUser: IAuthUser): Promise<IBarrierResponse>;
export declare function deleteBarrier(barrierId: string, currentUser: IAuthUser): Promise<{
    id: string;
}>;
export declare function verifyBarrier(barrierId: string, input: IVerifyBarrierInput, currentUser: IAuthUser): Promise<IBarrierResponse>;
//# sourceMappingURL=barrier.service.d.ts.map