import express, { Router } from "express";
import { uploadImage } from "../controllers/upload.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/rbac.middleware.js";
import { createRateLimiter } from "../middlewares/rate-limit.middleware.js";
import { UserRole } from "../config/roles.js";

const router = Router();

const uploadLimiter = createRateLimiter({
  keyPrefix: "upload",
  windowMs: 15 * 60 * 1000,
  maxRequests: 40,
  message: "Too many upload requests. Please try again later.",
});

router.post(
  "/",
  authenticate,
  authorizeRoles(UserRole.REGULAR, UserRole.CONTRIBUTOR, UserRole.MODERATOR, UserRole.ADMIN),
  uploadLimiter,
  express.raw({ type: ["image/*", "multipart/form-data"], limit: "6mb" }),
  uploadImage
);

export default router;
