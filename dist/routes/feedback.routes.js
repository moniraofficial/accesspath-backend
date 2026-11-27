"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const feedback_controller_js_1 = require("../controllers/feedback.controller.js");
const auth_middleware_js_1 = require("../middlewares/auth.middleware.js");
const rbac_middleware_js_1 = require("../middlewares/rbac.middleware.js");
const roles_js_1 = require("../config/roles.js");
const router = (0, express_1.Router)();
router.get("/", feedback_controller_js_1.list);
router.post("/", auth_middleware_js_1.authenticate, (0, rbac_middleware_js_1.authorizePermissions)(roles_js_1.Permissions.SUBMIT_FEEDBACK), feedback_controller_js_1.create);
router.patch("/:id", auth_middleware_js_1.authenticate, (0, rbac_middleware_js_1.authorizePermissions)(roles_js_1.Permissions.SUBMIT_FEEDBACK), feedback_controller_js_1.update);
router.delete("/:id", auth_middleware_js_1.authenticate, feedback_controller_js_1.remove);
router.patch("/:id/moderate", auth_middleware_js_1.authenticate, (0, rbac_middleware_js_1.authorizePermissions)(roles_js_1.Permissions.MODERATE_FEEDBACK), feedback_controller_js_1.moderate);
exports.default = router;
//# sourceMappingURL=feedback.routes.js.map