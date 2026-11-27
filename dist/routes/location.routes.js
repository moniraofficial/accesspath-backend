"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const location_controller_js_1 = require("../controllers/location.controller.js");
const auth_middleware_js_1 = require("../middlewares/auth.middleware.js");
const rbac_middleware_js_1 = require("../middlewares/rbac.middleware.js");
const roles_js_1 = require("../config/roles.js");
const router = (0, express_1.Router)();
// Public location discovery & details
router.get("/", location_controller_js_1.list);
router.get("/:id", location_controller_js_1.getById);
// Authenticated location submission & management (Regular users cannot create/edit/delete)
router.post("/", auth_middleware_js_1.authenticate, (0, rbac_middleware_js_1.authorizeRoles)(roles_js_1.UserRole.CONTRIBUTOR, roles_js_1.UserRole.MODERATOR, roles_js_1.UserRole.ADMIN), location_controller_js_1.create);
router.patch("/:id", auth_middleware_js_1.authenticate, (0, rbac_middleware_js_1.authorizeRoles)(roles_js_1.UserRole.CONTRIBUTOR, roles_js_1.UserRole.MODERATOR, roles_js_1.UserRole.ADMIN), location_controller_js_1.update);
router.delete("/:id", auth_middleware_js_1.authenticate, (0, rbac_middleware_js_1.authorizeRoles)(roles_js_1.UserRole.CONTRIBUTOR, roles_js_1.UserRole.MODERATOR, roles_js_1.UserRole.ADMIN), location_controller_js_1.remove);
// Verification workflow (Admin & Moderator only, with anti-self-approval enforced in service)
router.patch("/:id/verify", auth_middleware_js_1.authenticate, (0, rbac_middleware_js_1.authorizePermissions)(roles_js_1.Permissions.VERIFY_LOCATIONS), location_controller_js_1.verify);
exports.default = router;
//# sourceMappingURL=location.routes.js.map