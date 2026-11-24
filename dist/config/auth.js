"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authConfig = void 0;
exports.authConfig = {
    jwtSecret: process.env.JWT_SECRET || "accesspath_default_jwt_secret_change_in_production",
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "15m",
    refreshSecret: process.env.JWT_REFRESH_SECRET || "accesspath_default_refresh_secret_change_in_production",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
    bcryptSaltRounds: 10,
};
//# sourceMappingURL=auth.js.map