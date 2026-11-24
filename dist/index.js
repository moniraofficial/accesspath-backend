"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./config/env.js");
const node_dns_1 = __importDefault(require("node:dns"));
node_dns_1.default.setServers(["8.8.8.8", "1.1.1.1"]);
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const error_middleware_js_1 = require("./middlewares/error.middleware.js");
const apiResponse_js_1 = require("./utils/apiResponse.js");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Core Middlewares
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Root Health / Test Endpoint
app.get("/", (req, res) => {
    return (0, apiResponse_js_1.sendResponse)(res, 200, "AccessPath TypeScript backend server is running");
});
// 404 Route Not Found Middleware
app.use(error_middleware_js_1.notFoundHandler);
// Global Centralized Error Handling Middleware
app.use(error_middleware_js_1.errorHandler);
// MongoDB Connection & Server Start
const connectDBAndStartServer = async () => {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            throw new Error("MONGO_URI is missing in .env file");
        }
        await mongoose_1.default.connect(mongoUri);
        console.log("MongoDB Connected");
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unknown database error";
        console.error("Database connection failed:", message);
        process.exit(1);
    }
};
connectDBAndStartServer();
//# sourceMappingURL=index.js.map