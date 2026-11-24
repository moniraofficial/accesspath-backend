import "./config/env.js";

import dns from "node:dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

import express, { Request, Response } from "express";
import mongoose from "mongoose";
import cors from "cors";

import { errorHandler, notFoundHandler } from "./middlewares/error.middleware.js";
import { sendResponse } from "./utils/apiResponse.js";

const app = express();
const PORT = process.env.PORT || 5000;

// Core Middlewares
app.use(cors());
app.use(express.json());

// Root Health / Test Endpoint
app.get("/", (req: Request, res: Response) => {
  return sendResponse(res, 200, "AccessPath TypeScript backend server is running");
});

// 404 Route Not Found Middleware
app.use(notFoundHandler);

// Global Centralized Error Handling Middleware
app.use(errorHandler);

// MongoDB Connection & Server Start
const connectDBAndStartServer = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("MONGO_URI is missing in .env file");
    }

    await mongoose.connect(mongoUri);
    console.log("MongoDB Connected");

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown database error";
    console.error("Database connection failed:", message);
    process.exit(1);
  }
};

connectDBAndStartServer();
