import { Router } from "express";
import {
  create,
  getById,
  list,
  listMyReports,
  remove,
  update,
  verify,
} from "../controllers/barrier.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import {
  authorizePermissions,
  authorizeRoles,
} from "../middlewares/rbac.middleware.js";
import { Permissions, UserRole } from "../config/roles.js";

const router = Router();

// Authenticated "My Reports" endpoint (must come before /:id)
router.get("/my", authenticate, listMyReports);

// Public barrier listing & details
router.get("/", list);
router.get("/:id", getById);

// Barrier reporting & management
router.post(
  "/",
  authenticate,
  authorizeRoles(UserRole.REGULAR, UserRole.CONTRIBUTOR, UserRole.MODERATOR, UserRole.ADMIN),
  create
);

router.patch(
  "/:id",
  authenticate,
  authorizeRoles(UserRole.REGULAR, UserRole.CONTRIBUTOR, UserRole.MODERATOR, UserRole.ADMIN),
  update
);

router.delete(
  "/:id",
  authenticate,
  authorizeRoles(UserRole.REGULAR, UserRole.CONTRIBUTOR, UserRole.MODERATOR, UserRole.ADMIN),
  remove
);

// Barrier verification / resolution (Admin & Moderator only, anti-self-approval in service)
router.patch(
  "/:id/verify",
  authenticate,
  authorizePermissions(Permissions.VERIFY_BARRIERS),
  verify
);

export default router;
