import { Types, Document } from "mongoose";
export interface IRefreshToken {
    userId: Types.ObjectId;
    jti: string;
    familyId: string;
    tokenHash: string;
    isUsed: boolean;
    isRevoked: boolean;
    expiresAt: Date;
    rotatedAt?: Date;
    userAgent?: string;
    ipAddress?: string;
    replacementPayload?: string;
    encryptionIv?: string;
    encryptionTag?: string;
    encryptionKeyVersion?: string;
    replacementExpiresAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface IRefreshTokenDocument extends IRefreshToken, Document {
    _id: Types.ObjectId;
}
//# sourceMappingURL=refresh-token.types.d.ts.map