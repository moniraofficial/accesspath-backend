"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_routes_js_1 = __importDefault(require("./routes/auth.routes.js"));
const location_routes_js_1 = __importDefault(require("./routes/location.routes.js"));
const barrier_routes_js_1 = __importDefault(require("./routes/barrier.routes.js"));
const feedback_routes_js_1 = __importDefault(require("./routes/feedback.routes.js"));
const favorite_routes_js_1 = __importDefault(require("./routes/favorite.routes.js"));
const route_routes_js_1 = __importDefault(require("./routes/route.routes.js"));
const admin_routes_js_1 = __importDefault(require("./routes/admin.routes.js"));
const upload_routes_js_1 = __importDefault(require("./routes/upload.routes.js"));
const upload_service_js_1 = require("./services/upload.service.js");
const error_middleware_js_1 = require("./middlewares/error.middleware.js");
const apiResponse_js_1 = require("./utils/apiResponse.js");
const app = (0, express_1.default)();
// Core Middlewares
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: "8mb" }));
app.use("/uploads", express_1.default.static(upload_service_js_1.UPLOADS_DIR, {
    setHeaders: (res) => {
        res.setHeader("X-Content-Type-Options", "nosniff");
    },
}));
// Root Health / Test Endpoint
app.get("/", (_req, res) => {
    return (0, apiResponse_js_1.sendResponse)(res, 200, "AccessPath TypeScript backend server is running");
});
// API v1 Routes
app.use("/api/v1/auth", auth_routes_js_1.default);
app.use("/api/v1/locations", location_routes_js_1.default);
app.use("/api/v1/barriers", barrier_routes_js_1.default);
app.use("/api/v1/feedback", feedback_routes_js_1.default);
app.use("/api/v1/favorites", favorite_routes_js_1.default);
app.use("/api/v1/routes", route_routes_js_1.default);
app.use("/api/v1/admin", admin_routes_js_1.default);
app.use("/api/v1/uploads", upload_routes_js_1.default);
// 404 Route Not Found Middleware
app.use(error_middleware_js_1.notFoundHandler);
// Global Centralized Error Handling Middleware
app.use(error_middleware_js_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map