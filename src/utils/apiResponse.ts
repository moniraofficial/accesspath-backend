import { Response } from "express";
import { IApiResponse, IPaginationMeta } from "../types/index.js";

export class ApiResponse<T = unknown> {
  public readonly success: boolean;
  public readonly statusCode: number;
  public readonly message: string;
  public readonly data?: T;
  public readonly meta?: IPaginationMeta | Record<string, unknown>;

  constructor(
    statusCode: number,
    message: string,
    data?: T,
    meta?: IPaginationMeta | Record<string, unknown>
  ) {
    this.success = statusCode >= 200 && statusCode < 300;
    this.statusCode = statusCode;
    this.message = message;
    if (data !== undefined) {
      this.data = data;
    }
    if (meta !== undefined) {
      this.meta = meta;
    }
  }

  public toJSON(): IApiResponse<T> {
    const payload: IApiResponse<T> = {
      success: this.success,
      statusCode: this.statusCode,
      message: this.message,
    };

    if (this.data !== undefined) {
      payload.data = this.data;
    }

    if (this.meta !== undefined) {
      payload.meta = this.meta;
    }

    return payload;
  }

  public send(res: Response): Response {
    return res.status(this.statusCode).json(this.toJSON());
  }
}

export const sendResponse = <T>(
  res: Response,
  statusCode: number,
  message: string,
  data?: T,
  meta?: IPaginationMeta | Record<string, unknown>
): Response => {
  return new ApiResponse(statusCode, message, data, meta).send(res);
};
