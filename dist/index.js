"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./config/env.js");
const node_dns_1 = __importDefault(require("node:dns"));
node_dns_1.default.setServers(["8.8.8.8", "1.1.1.1"]);
const mongoose_1 = __importDefault(require("mongoose"));
const app_js_1 = __importDefault(require("./app.js"));
const PORT = process.env.PORT || 5000;
// MongoDB Connection & Server Start
const connectDBAndStartServer = async () => {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            throw new Error("MONGO_URI is missing in .env file");
        }
        await mongoose_1.default.connect(mongoUri);
        console.log("MongoDB Connected");
        app_js_1.default.listen(PORT, () => {
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