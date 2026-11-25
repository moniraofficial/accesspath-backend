/**
 * Hashes a plaintext password using bcrypt with configured salt rounds.
 * Never logs or reveals the password or resulting hash.
 */
export declare function hashPassword(password: string): Promise<string>;
/**
 * Securely compares a plaintext password with a bcrypt hash in constant-time.
 * Returns boolean; handles errors safely without throwing.
 */
export declare function comparePassword(password: string, hashedPassword?: string): Promise<boolean>;
//# sourceMappingURL=password.d.ts.map