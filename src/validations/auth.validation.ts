import { UserRole } from "../config/roles.js";
import { ApiError } from "../utils/apiError.js";

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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[a-zA-Z])(?=.*\d)/;

/**
 * Validates and sanitizes user registration input.
 * Strictly enforces minimum 8 characters, letter + number, valid email, and rejects privileged role assignments.
 */
export function validateRegistrationInput(data: unknown): IRegisterInput {
  if (!data || typeof data !== "object") {
    throw ApiError.badRequest("Invalid request body: expected JSON object.");
  }

  const body = data as Record<string, unknown>;

  // Security Check: Public users cannot assign themselves privileged roles.
  // We explicitly check for the presence of the key and that it is not undefined/null
  // before the string comparison, so a non-string value is also rejected.
  if ("role" in body && body.role !== undefined && body.role !== null && body.role !== UserRole.REGULAR) {
    throw ApiError.badRequest("Assigning roles during public registration is not permitted.");
  }

  const rawName = body.name;
  const rawEmail = body.email;
  const rawPassword = body.password;

  // Name validation
  if (!rawName || typeof rawName !== "string") {
    throw ApiError.badRequest("Name is required and must be a string.");
  }
  const trimmedName = rawName.trim();
  if (trimmedName.length < 2 || trimmedName.length > 100) {
    throw ApiError.badRequest("Name must be between 2 and 100 characters.");
  }

  // Email validation & normalization
  if (!rawEmail || typeof rawEmail !== "string") {
    throw ApiError.badRequest("Email is required and must be a string.");
  }
  const normalizedEmail = rawEmail.trim().toLowerCase();
  if (!EMAIL_REGEX.test(normalizedEmail)) {
    throw ApiError.badRequest("Please provide a valid email address.");
  }

  // Password validation (min 8 chars, letter + number)
  if (!rawPassword || typeof rawPassword !== "string") {
    throw ApiError.badRequest("Password is required and must be a string.");
  }
  if (rawPassword.length < 8) {
    throw ApiError.badRequest("Password must be at least 8 characters long.");
  }
  if (!PASSWORD_REGEX.test(rawPassword)) {
    throw ApiError.badRequest("Password must contain at least one letter and one number.");
  }

  return {
    name: trimmedName,
    email: normalizedEmail,
    password: rawPassword,
  };
}

/**
 * Validates and sanitizes user login input.
 */
export function validateLoginInput(data: unknown): ILoginInput {
  if (!data || typeof data !== "object") {
    throw ApiError.badRequest("Invalid request body: expected JSON object.");
  }

  const body = data as Record<string, unknown>;
  const rawEmail = body.email;
  const rawPassword = body.password;

  if (!rawEmail || typeof rawEmail !== "string") {
    throw ApiError.badRequest("Email is required.");
  }
  const normalizedEmail = rawEmail.trim().toLowerCase();
  if (!EMAIL_REGEX.test(normalizedEmail)) {
    throw ApiError.badRequest("Please provide a valid email address.");
  }

  if (!rawPassword || typeof rawPassword !== "string" || !rawPassword.length) {
    throw ApiError.badRequest("Password is required.");
  }

  return {
    email: normalizedEmail,
    password: rawPassword,
  };
}

/**
 * Validates refresh token request body.
 */
export function validateRefreshTokenInput(data: unknown): IRefreshTokenInput {
  if (!data || typeof data !== "object") {
    throw ApiError.badRequest("Invalid request body: expected JSON object.");
  }

  const body = data as Record<string, unknown>;
  const rawRefreshToken = body.refreshToken;

  if (!rawRefreshToken || typeof rawRefreshToken !== "string" || !rawRefreshToken.trim().length) {
    throw ApiError.badRequest("Refresh token is required.");
  }

  return {
    refreshToken: rawRefreshToken.trim(),
  };
}

/**
 * Validates logout request body.
 */
export function validateLogoutInput(data: unknown): ILogoutInput {
  if (!data || typeof data !== "object") {
    return {};
  }

  const body = data as Record<string, unknown>;
  const rawRefreshToken = body.refreshToken;

  if (rawRefreshToken && typeof rawRefreshToken === "string") {
    return { refreshToken: rawRefreshToken.trim() };
  }

  return {};
}
