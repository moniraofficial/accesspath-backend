"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTest = exports.isDevelopment = exports.isProduction = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
// Synchronously initialize dotenv before any other modules read process.env
dotenv_1.default.config();
exports.isProduction = process.env.NODE_ENV === "production";
exports.isDevelopment = process.env.NODE_ENV === "development" || !process.env.NODE_ENV;
exports.isTest = process.env.NODE_ENV === "test";
//# sourceMappingURL=env.js.map