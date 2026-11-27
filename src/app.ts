import express, { Request, Response } from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import locationRoutes from "./routes/location.routes.js";
import barrierRoutes from "./routes/barrier.routes.js";
import feedbackRoutes from "./routes/feedback.routes.js";
import favoriteRoutes from "./routes/favorite.routes.js";
import routeRoutes from "./routes/route.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import { UPLOADS_DIR } from "./services/upload.service.js";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware.js";
import { sendResponse } from "./utils/apiResponse.js";

const app = express();

// Core Middlewares
app.use(cors());
app.use(express.json({ limit: "8mb" }));
app.use(
  "/uploads",
  express.static(UPLOADS_DIR, {
    setHeaders: (res) => {
      res.setHeader("X-Content-Type-Options", "nosniff");
    },
  })
);

// Root Health / Test Endpoint
app.get("/", (_req: Request, res: Response) => {
  return sendResponse(res, 200, "AccessPath TypeScript backend server is running");
});

// API v1 Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/locations", locationRoutes);
app.use("/api/v1/barriers", barrierRoutes);
app.use("/api/v1/feedback", feedbackRoutes);
app.use("/api/v1/favorites", favoriteRoutes);
app.use("/api/v1/routes", routeRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/uploads", uploadRoutes);

// 404 Route Not Found Middleware
app.use(notFoundHandler);

// Global Centralized Error Handling Middleware
app.use(errorHandler);

export default app;
