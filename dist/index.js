"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Test Route
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "AccessPath TypeScript backend server is running",
    });
});
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