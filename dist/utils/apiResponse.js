"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendResponse = exports.ApiResponse = void 0;
class ApiResponse {
    success;
    statusCode;
    message;
    data;
    meta;
    constructor(statusCode, message, data, meta) {
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
    toJSON() {
        const payload = {
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
    send(res) {
        return res.status(this.statusCode).json(this.toJSON());
    }
}
exports.ApiResponse = ApiResponse;
const sendResponse = (res, statusCode, message, data, meta) => {
    return new ApiResponse(statusCode, message, data, meta).send(res);
};
exports.sendResponse = sendResponse;
//# sourceMappingURL=apiResponse.js.map