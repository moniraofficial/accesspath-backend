import bcrypt from "bcryptjs";
import { authConfig } from "../config/auth.js";
import { ApiError } from "./apiError.js";

/** Maximum UTF-8 byte length accepted by bcrypt before silent truncation occurs. */
const BCRYPT_MAX_BYTES = 72;

/**
 * Throws if the password's UTF-8 byte length exceeds bcrypt's 72-byte hard limit.
 * bcrypt silently truncates at 72 bytes — we reject rather than silently truncate,
 * because truncation can cause two distinct passwords to hash identically.
 */
function assertBcryptByteLimit(password: string): void {
  const byteLength = Buffer.byteLength(password, "utf8");
  if (byteLength > BCRYPT_MAX_BYTES) {
    throw ApiError.badRequest(
      `Password must not exceed ${BCRYPT_MAX_BYTES} UTF-8 bytes (current: ${byteLength} bytes). ` +
        "Use a shorter passphrase or avoid multi-byte Unicode characters."
    );
  }
}

/**
 * Hashes a plaintext password using bcrypt with configured salt rounds.
 * Rejects passwords that exceed bcrypt's 72-byte limit to prevent silent truncation.
 * Never logs or reveals the password or resulting hash.
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || typeof password !== "string") {
    throw ApiError.badRequest("Password must be a non-empty string.");
  }

  assertBcryptByteLimit(password);

  try {
    const salt = await bcrypt.genSalt(authConfig.bcryptSaltRounds);
    return await bcrypt.hash(password, salt);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw ApiError.internal("Failed to hash password safely.");
  }
}

/**
 * Securely compares a plaintext password with a bcrypt hash in constant-time.
 * Rejects passwords exceeding bcrypt's 72-byte limit before comparison.
 * Returns boolean; handles errors safely without throwing.
 */
export async function comparePassword(password: string, hashedPassword?: string): Promise<boolean> {
  if (!password || !hashedPassword || typeof password !== "string" || typeof hashedPassword !== "string") {
    return false;
  }

  // Reject oversized passwords before comparison — same guard as hashPassword
  if (Buffer.byteLength(password, "utf8") > BCRYPT_MAX_BYTES) {
    return false;
  }

  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch {
    return false;
  }
}
