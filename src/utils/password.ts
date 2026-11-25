import bcrypt from "bcryptjs";
import { authConfig } from "../config/auth.js";
import { ApiError } from "./apiError.js";

/**
 * Hashes a plaintext password using bcrypt with configured salt rounds.
 * Never logs or reveals the password or resulting hash.
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || typeof password !== "string") {
    throw ApiError.badRequest("Password must be a non-empty string.");
  }

  try {
    const salt = await bcrypt.genSalt(authConfig.bcryptSaltRounds);
    return await bcrypt.hash(password, salt);
  } catch (error) {
    throw ApiError.internal("Failed to hash password safely.");
  }
}

/**
 * Securely compares a plaintext password with a bcrypt hash in constant-time.
 * Returns boolean; handles errors safely without throwing.
 */
export async function comparePassword(password: string, hashedPassword?: string): Promise<boolean> {
  if (!password || !hashedPassword || typeof password !== "string" || typeof hashedPassword !== "string") {
    return false;
  }

  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch {
    return false;
  }
}
