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

  const body = data as Record<string, any>;

  // Security Check: Public users cannot assign themselves privileged roles
  if ("role" in body && body.role !== UserRole.REGULAR) {
    throw ApiError.badRequest("Assigning roles during public registration is not permitted.");
  }

  const { name, email, password } = body;

  // Name validation
  if (!name || typeof name !== "string") {
    throw ApiError.badRequest("Name is required and must be a string.");
  }
  const trimmedName = name.trim();
  if (trimmedName.length < 2 || trimmedName.length > 100) {
    throw ApiError.badRequest("Name must be between 2 and 100 characters.");
  }

  // Email validation & normalization
  if (!email || typeof email !== "string") {
    throw ApiError.badRequest("Email is required and must be a string.");
  }
  const normalizedEmail = email.trim().toLowerCase();
  if (!EMAIL_REGEX.test(normalizedEmail)) {
    throw ApiError.badRequest("Please provide a valid email address.");
  }

  // Password validation (min 8 chars, letter + number)
  if (!password || typeof password !== "string") {
    throw ApiError.badRequest("Password is required and must be a string.");
  }
  if (password.length < 8) {
    throw ApiError.badRequest("Password must be at least 8 characters long.");
  }
  if (!PASSWORD_REGEX.test(password)) {
    throw ApiError.badRequest("Password must contain at least one letter and one number.");
  }

  return {
    name: trimmedName,
    email: normalizedEmail,
    password,
  };
}

/**
 * Validates and sanitizes user login input.
 */
export function validateLoginInput(data: unknown): ILoginInput {
  if (!data || typeof data !== "object") {
    throw ApiError.badRequest("Invalid request body: expected JSON object.");
  }

  const body = data as Record<string, any>;
  const { email, password } = body;

  if (!email || typeof email !== "string") {
    throw ApiError.badRequest("Email is required.");
  }
  const normalizedEmail = email.trim().toLowerCase();
  if (!EMAIL_REGEX.test(normalizedEmail)) {
    throw ApiError.badRequest("Please provide a valid email address.");
  }

  if (!password || typeof password !== "string" || !password.length) {
    throw ApiError.badRequest("Password is required.");
  }

  return {
    email: normalizedEmail,
    password,
  };
}

/**
 * Validates refresh token request body.
 */
export function validateRefreshTokenInput(data: unknown): IRefreshTokenInput {
  if (!data || typeof data !== "object") {
    throw ApiError.badRequest("Invalid request body: expected JSON object.");
  }

  const body = data as Record<string, any>;
  const { refreshToken } = body;

  if (!refreshToken || typeof refreshToken !== "string" || !refreshToken.trim().length) {
    throw ApiError.badRequest("Refresh token is required.");
  }

  return {
    refreshToken: refreshToken.trim(),
  };
}

/**
 * Validates logout request body.
 */
export function validateLogoutInput(data: unknown): ILogoutInput {
  if (!data || typeof data !== "object") {
    return {};
  }

  const body = data as Record<string, any>;
  const { refreshToken } = body;

  if (refreshToken && typeof refreshToken === "string") {
    return { refreshToken: refreshToken.trim() };
  }

  return {};
}
