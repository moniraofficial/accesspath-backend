import mongoose from "mongoose";
import { IAuthUser, IPaginationMeta } from "../types/index.js";
import { IFeedbackDocument, IFeedbackResponse } from "../types/feedback.types.js";
import { ICreateFeedbackInput, IFeedbackQuery, IModerateFeedbackInput, IUpdateFeedbackInput } from "../validations/feedback.validation.js";
export declare function toFeedbackResponse(doc: IFeedbackDocument | (Record<string, any> & {
    _id: mongoose.Types.ObjectId;
})): IFeedbackResponse;
export declare function createFeedback(input: ICreateFeedbackInput, currentUser: IAuthUser): Promise<IFeedbackResponse>;
export declare function listFeedback(query: IFeedbackQuery, currentUser?: IAuthUser): Promise<{
    items: IFeedbackResponse[];
    meta: IPaginationMeta;
}>;
export declare function updateFeedback(feedbackId: string, updates: IUpdateFeedbackInput, currentUser: IAuthUser): Promise<IFeedbackResponse>;
export declare function deleteFeedback(feedbackId: string, currentUser: IAuthUser): Promise<{
    id: string;
}>;
export declare function moderateFeedback(feedbackId: string, input: IModerateFeedbackInput, currentUser: IAuthUser): Promise<IFeedbackResponse>;
//# sourceMappingURL=feedback.service.d.ts.map