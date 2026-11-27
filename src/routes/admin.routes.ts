import { Router } from "express";
import {
  analytics,
  listUsers,
  updateUser,
} from "../controllers/admin.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorizePermissions } from "../middlewares/rbac.middleware.js";
import { Permissions } from "../config/roles.js";

const router = Router();

router.use(authenticate);

router.get("/users", authorizePermissions(Permissions.MANAGE_USERS), listUsers);
router.patch("/users/:id", authorizePermissions(Permissions.MANAGE_USERS), updateUser);
router.get("/analytics", authorizePermissions(Permissions.VIEW_ANALYTICS), analytics);

export default router;
