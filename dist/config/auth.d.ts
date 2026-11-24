import "./env.js";
/**
 * Centralized Authentication Configuration with Lazy Getters.
 * Properties are resolved dynamically at access time to prevent ES module hoisting races.
 */
export declare const authConfig: {
    readonly jwtSecret: string;
    readonly refreshSecret: string;
    readonly accessExpiresIn: string;
    readonly refreshExpiresIn: string;
    readonly currentKeyVersion: string;
    readonly getEncryptionKey: (version?: string) => Buffer;
    readonly bcryptSaltRounds: 10;
    readonly graceWindowMs: number;
};
//# sourceMappingURL=auth.d.ts.map