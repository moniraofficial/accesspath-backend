/**
 * Hashes a plaintext password using bcrypt with configured salt rounds.
 * Rejects passwords that exceed bcrypt's 72-byte limit to prevent silent truncation.
 * Never logs or reveals the password or resulting hash.
 */
export declare function hashPassword(password: string): Promise<string>;
/**
 * Securely compares a plaintext password with a bcrypt hash in constant-time.
 * Rejects passwords exceeding bcrypt's 72-byte limit before comparison.
 * Returns boolean; handles errors safely without throwing.
 */
export declare function comparePassword(password: string, hashedPassword?: string): Promise<boolean>;
//# sourceMappingURL=password.d.ts.map