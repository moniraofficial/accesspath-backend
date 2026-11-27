"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const favorite_controller_js_1 = require("../controllers/favorite.controller.js");
const auth_middleware_js_1 = require("../middlewares/auth.middleware.js");
const rbac_middleware_js_1 = require("../middlewares/rbac.middleware.js");
const roles_js_1 = require("../config/roles.js");
const router = (0, express_1.Router)();
router.use(auth_middleware_js_1.authenticate, (0, rbac_middleware_js_1.authorizePermissions)(roles_js_1.Permissions.MANAGE_FAVORITES));
router.get("/", favorite_controller_js_1.list);
router.post("/:locationId", favorite_controller_js_1.add);
router.delete("/:locationId", favorite_controller_js_1.remove);
exports.default = router;
//# sourceMappingURL=favorite.routes.js.map