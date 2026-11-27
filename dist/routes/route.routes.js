"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const route_controller_js_1 = require("../controllers/route.controller.js");
const router = (0, express_1.Router)();
router.post("/discover", route_controller_js_1.discover);
exports.default = router;
//# sourceMappingURL=route.routes.js.map