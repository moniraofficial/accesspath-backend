import { Types, Document } from "mongoose";

export const FeedbackStatus = {
  ACTIVE: "active",
  HIDDEN: "hidden",
} as const;

export type FeedbackStatusType = (typeof FeedbackStatus)[keyof typeof FeedbackStatus];

export interface IFeedback {
  locationId: Types.ObjectId;
  userId: Types.ObjectId;
  rating: number;
  comment: string;
  status: FeedbackStatusType;
  moderatedBy?: Types.ObjectId;
  moderatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFeedbackDocument extends IFeedback, Document {
  _id: Types.ObjectId;
}

export interface IFeedbackResponse {
  id: string;
  locationId: string;
  userId: string;
  rating: number;
  comment: string;
  status: FeedbackStatusType;
  moderatedBy?: string;
  moderatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
