export interface IRegisterInput {
    name: string;
    email: string;
    password: string;
}
export interface ILoginInput {
    email: string;
    password: string;
}
export interface IRefreshTokenInput {
    refreshToken: string;
}
export interface ILogoutInput {
    refreshToken?: string;
}
/**
 * Validates and sanitizes user registration input.
 * Strictly enforces minimum 8 characters, letter + number, valid email, and rejects privileged role assignments.
 */
export declare function validateRegistrationInput(data: unknown): IRegisterInput;
/**
 * Validates and sanitizes user login input.
 */
export declare function validateLoginInput(data: unknown): ILoginInput;
/**
 * Validates refresh token request body.
 */
export declare function validateRefreshTokenInput(data: unknown): IRefreshTokenInput;
/**
 * Validates logout request body.
 */
export declare function validateLogoutInput(data: unknown): ILogoutInput;
//# sourceMappingURL=auth.validation.d.ts.map