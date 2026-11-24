import dotenv from "dotenv";

// Synchronously initialize dotenv before any other modules read process.env
dotenv.config();

export const isProduction = process.env.NODE_ENV === "production";
export const isDevelopment = process.env.NODE_ENV === "development" || !process.env.NODE_ENV;
export const isTest = process.env.NODE_ENV === "test";
