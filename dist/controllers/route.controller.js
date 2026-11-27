"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.discover = discover;
const route_validation_js_1 = require("../validations/route.validation.js");
const route_service_js_1 = require("../services/route.service.js");
const apiResponse_js_1 = require("../utils/apiResponse.js");
async function discover(req, res, next) {
    try {
        const input = (0, route_validation_js_1.validateDiscoverRoutesInput)(req.body);
        const result = await (0, route_service_js_1.discoverAccessibleRoutes)(input);
        (0, apiResponse_js_1.sendResponse)(res, 200, "Accessible routes discovered successfully.", result);
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=route.controller.js.map