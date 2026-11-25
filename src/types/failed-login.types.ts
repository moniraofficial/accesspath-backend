import { Types, Document } from "mongoose";

export interface IFailedLogin {
  key: string;
  attempts: number;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFailedLoginDocument extends IFailedLogin, Document {
  _id: Types.ObjectId;
}
