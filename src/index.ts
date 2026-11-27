import "./config/env.js";

import dns from "node:dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

import mongoose from "mongoose";
import app from "./app.js";

const PORT = process.env.PORT || 5000;

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
