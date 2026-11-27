import { FeedbackStatusType } from "../types/feedback.types.js";
export interface ICreateFeedbackInput {
    locationId: string;
    rating: number;
    comment: string;
}
export interface IUpdateFeedbackInput {
    rating?: number;
    comment?: string;
}
export interface IModerateFeedbackInput {
    status: FeedbackStatusType;
}
export interface IFeedbackQuery {
    page: number;
    limit: number;
    locationId?: string;
    status?: FeedbackStatusType;
}
export declare function validateCreateFeedbackInput(data: unknown): ICreateFeedbackInput;
export declare function validateUpdateFeedbackInput(data: unknown): IUpdateFeedbackInput;
export declare function validateModerateFeedbackInput(data: unknown): IModerateFeedbackInput;
export declare function validatePaginationParams(query: unknown): {
    page: number;
    limit: number;
};
export declare function validateFeedbackQuery(query: unknown): IFeedbackQuery;
//# sourceMappingURL=feedback.validation.d.ts.map