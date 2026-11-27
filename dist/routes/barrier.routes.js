"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const barrier_controller_js_1 = require("../controllers/barrier.controller.js");
const auth_middleware_js_1 = require("../middlewares/auth.middleware.js");
const rbac_middleware_js_1 = require("../middlewares/rbac.middleware.js");
const roles_js_1 = require("../config/roles.js");
const router = (0, express_1.Router)();
// Authenticated "My Reports" endpoint (must come before /:id)
router.get("/my", auth_middleware_js_1.authenticate, barrier_controller_js_1.listMyReports);
// Public barrier listing & details
router.get("/", barrier_controller_js_1.list);
router.get("/:id", barrier_controller_js_1.getById);
// Barrier reporting & management
router.post("/", auth_middleware_js_1.authenticate, (0, rbac_middleware_js_1.authorizeRoles)(roles_js_1.UserRole.REGULAR, roles_js_1.UserRole.CONTRIBUTOR, roles_js_1.UserRole.MODERATOR, roles_js_1.UserRole.ADMIN), barrier_controller_js_1.create);
router.patch("/:id", auth_middleware_js_1.authenticate, (0, rbac_middleware_js_1.authorizeRoles)(roles_js_1.UserRole.REGULAR, roles_js_1.UserRole.CONTRIBUTOR, roles_js_1.UserRole.MODERATOR, roles_js_1.UserRole.ADMIN), barrier_controller_js_1.update);
router.delete("/:id", auth_middleware_js_1.authenticate, (0, rbac_middleware_js_1.authorizeRoles)(roles_js_1.UserRole.REGULAR, roles_js_1.UserRole.CONTRIBUTOR, roles_js_1.UserRole.MODERATOR, roles_js_1.UserRole.ADMIN), barrier_controller_js_1.remove);
// Barrier verification / resolution (Admin & Moderator only, anti-self-approval in service)
router.patch("/:id/verify", auth_middleware_js_1.authenticate, (0, rbac_middleware_js_1.authorizePermissions)(roles_js_1.Permissions.VERIFY_BARRIERS), barrier_controller_js_1.verify);
exports.default = router;
//# sourceMappingURL=barrier.routes.js.map