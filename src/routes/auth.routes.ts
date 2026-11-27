import { Router } from "express";
import {
  register,
  login,
  refresh,
  logout,
  logoutAll,
  getMe,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { createRateLimiter } from "../middlewares/rate-limit.middleware.js";

const router = Router();

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

const registerLimiter = createRateLimiter({
  keyPrefix: "register",
  windowMs: FIFTEEN_MINUTES_MS,
  maxRequests: 20,
  message: "Too many registration attempts. Please try again later.",
});

const loginLimiter = createRateLimiter({
  keyPrefix: "login_flood",
  windowMs: FIFTEEN_MINUTES_MS,
  maxRequests: 60,
  message: "Too many login requests. Please try again later.",
});

const refreshLimiter = createRateLimiter({
  keyPrefix: "refresh",
  windowMs: FIFTEEN_MINUTES_MS,
  maxRequests: 60,
  message: "Too many token refresh requests. Please try again later.",
});

const logoutLimiter = createRateLimiter({
  keyPrefix: "logout",
  windowMs: FIFTEEN_MINUTES_MS,
  maxRequests: 30,
  message: "Too many logout requests. Please try again later.",
});

router.post("/register", registerLimiter, register);
router.post("/login", loginLimiter, login);
router.post("/refresh", refreshLimiter, refresh);
router.post("/logout", authenticate, logoutLimiter, logout);
router.post("/logout-all", authenticate, logoutLimiter, logoutAll);
router.get("/me", authenticate, getMe);

export default router;
