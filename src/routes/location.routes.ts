import { Router } from "express";
import {
  create,
  list,
  getById,
  update,
  remove,
  verify,
} from "../controllers/location.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import {
  authorizePermissions,
  authorizeRoles,
} from "../middlewares/rbac.middleware.js";
import { Permissions, UserRole } from "../config/roles.js";

const router = Router();

// Public location discovery & details
router.get("/", list);
router.get("/:id", getById);

// Authenticated location submission & management (Regular users cannot create/edit/delete)
router.post(
  "/",
  authenticate,
  authorizeRoles(UserRole.CONTRIBUTOR, UserRole.MODERATOR, UserRole.ADMIN),
  create
);

router.patch(
  "/:id",
  authenticate,
  authorizeRoles(UserRole.CONTRIBUTOR, UserRole.MODERATOR, UserRole.ADMIN),
  update
);

router.delete(
  "/:id",
  authenticate,
  authorizeRoles(UserRole.CONTRIBUTOR, UserRole.MODERATOR, UserRole.ADMIN),
  remove
);

// Verification workflow (Admin & Moderator only, with anti-self-approval enforced in service)
router.patch(
  "/:id/verify",
  authenticate,
  authorizePermissions(Permissions.VERIFY_LOCATIONS),
  verify
);

export default router;
