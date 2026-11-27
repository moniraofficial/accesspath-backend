import { Router } from "express";
import {
  create,
  list,
  moderate,
  remove,
  update,
} from "../controllers/feedback.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorizePermissions } from "../middlewares/rbac.middleware.js";
import { Permissions } from "../config/roles.js";

const router = Router();

router.get("/", list);

router.post(
  "/",
  authenticate,
  authorizePermissions(Permissions.SUBMIT_FEEDBACK),
  create
);

router.patch(
  "/:id",
  authenticate,
  authorizePermissions(Permissions.SUBMIT_FEEDBACK),
  update
);

router.delete("/:id", authenticate, remove);

router.patch(
  "/:id/moderate",
  authenticate,
  authorizePermissions(Permissions.MODERATE_FEEDBACK),
  moderate
);

export default router;
