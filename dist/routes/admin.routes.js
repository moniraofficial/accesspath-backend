"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_js_1 = require("../controllers/admin.controller.js");
const auth_middleware_js_1 = require("../middlewares/auth.middleware.js");
const rbac_middleware_js_1 = require("../middlewares/rbac.middleware.js");
const roles_js_1 = require("../config/roles.js");
const router = (0, express_1.Router)();
router.use(auth_middleware_js_1.authenticate);
router.get("/users", (0, rbac_middleware_js_1.authorizePermissions)(roles_js_1.Permissions.MANAGE_USERS), admin_controller_js_1.listUsers);
router.patch("/users/:id", (0, rbac_middleware_js_1.authorizePermissions)(roles_js_1.Permissions.MANAGE_USERS), admin_controller_js_1.updateUser);
router.get("/analytics", (0, rbac_middleware_js_1.authorizePermissions)(roles_js_1.Permissions.VIEW_ANALYTICS), admin_controller_js_1.analytics);
exports.default = router;
//# sourceMappingURL=admin.routes.js.map