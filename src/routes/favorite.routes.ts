import { Router } from "express";
import { add, list, remove } from "../controllers/favorite.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorizePermissions } from "../middlewares/rbac.middleware.js";
import { Permissions } from "../config/roles.js";

const router = Router();

router.use(authenticate, authorizePermissions(Permissions.MANAGE_FAVORITES));

router.get("/", list);
router.post("/:locationId", add);
router.delete("/:locationId", remove);

export default router;
