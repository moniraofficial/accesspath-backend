"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = create;
exports.list = list;
exports.listMyReports = listMyReports;
exports.getById = getById;
exports.update = update;
exports.remove = remove;
exports.verify = verify;
const barrier_validation_js_1 = require("../validations/barrier.validation.js");
const location_validation_js_1 = require("../validations/location.validation.js");
const barrier_service_js_1 = require("../services/barrier.service.js");
const apiResponse_js_1 = require("../utils/apiResponse.js");
const apiError_js_1 = require("../utils/apiError.js");
async function create(req, res, next) {
    try {
        if (!req.user) {
            return next(apiError_js_1.ApiError.unauthorized("Authentication required."));
        }
        const input = (0, barrier_validation_js_1.validateCreateBarrierInput)(req.body);
        const created = await (0, barrier_service_js_1.createBarrier)(input, req.user);
        (0, apiResponse_js_1.sendResponse)(res, 201, "Barrier report submitted successfully.", created);
    }
    catch (error) {
        next(error);
    }
}
async function list(req, res, next) {
    try {
        const query = (0, barrier_validation_js_1.validateBarrierQuery)(req.query);
        const { items, meta } = await (0, barrier_service_js_1.listBarriers)(query);
        (0, apiResponse_js_1.sendResponse)(res, 200, "Barrier reports retrieved successfully.", items, meta);
    }
    catch (error) {
        next(error);
    }
}
async function listMyReports(req, res, next) {
    try {
        if (!req.user) {
            return next(apiError_js_1.ApiError.unauthorized("Authentication required."));
        }
        const query = (0, barrier_validation_js_1.validateBarrierQuery)({ ...req.query, reportedBy: req.user.id });
        const { items, meta } = await (0, barrier_service_js_1.listBarriers)(query);
        (0, apiResponse_js_1.sendResponse)(res, 200, "Your barrier reports retrieved successfully.", items, meta);
    }
    catch (error) {
        next(error);
    }
}
async function getById(req, res, next) {
    try {
        const id = (0, location_validation_js_1.validateObjectIdParam)(req.params.id, "barrier ID");
        const barrier = await (0, barrier_service_js_1.getBarrierById)(id);
        (0, apiResponse_js_1.sendResponse)(res, 200, "Barrier report retrieved successfully.", barrier);
    }
    catch (error) {
        next(error);
    }
}
async function update(req, res, next) {
    try {
        if (!req.user) {
            return next(apiError_js_1.ApiError.unauthorized("Authentication required."));
        }
        const id = (0, location_validation_js_1.validateObjectIdParam)(req.params.id, "barrier ID");
        const updates = (0, barrier_validation_js_1.validateUpdateBarrierInput)(req.body);
        const updated = await (0, barrier_service_js_1.updateBarrier)(id, updates, req.user);
        (0, apiResponse_js_1.sendResponse)(res, 200, "Barrier report updated successfully.", updated);
    }
    catch (error) {
        next(error);
    }
}
async function remove(req, res, next) {
    try {
        if (!req.user) {
            return next(apiError_js_1.ApiError.unauthorized("Authentication required."));
        }
        const id = (0, location_validation_js_1.validateObjectIdParam)(req.params.id, "barrier ID");
        const deleted = await (0, barrier_service_js_1.deleteBarrier)(id, req.user);
        (0, apiResponse_js_1.sendResponse)(res, 200, "Barrier report deleted successfully.", deleted);
    }
    catch (error) {
        next(error);
    }
}
async function verify(req, res, next) {
    try {
        if (!req.user) {
            return next(apiError_js_1.ApiError.unauthorized("Authentication required."));
        }
        const id = (0, location_validation_js_1.validateObjectIdParam)(req.params.id, "barrier ID");
        const input = (0, barrier_validation_js_1.validateVerifyBarrierInput)(req.body);
        const verified = await (0, barrier_service_js_1.verifyBarrier)(id, input, req.user);
        (0, apiResponse_js_1.sendResponse)(res, 200, `Barrier report ${input.status} successfully.`, verified);
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=barrier.controller.js.map