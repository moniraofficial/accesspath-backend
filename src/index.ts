// import dotenv from "dotenv";
// import express, { Request, Response } from "express";
// import mongoose from "mongoose";
// import cors from "cors";

// dotenv.config();

// const app = express();
// const PORT = process.env.PORT || 5000;

// // Middleware
// app.use(cors());
// app.use(express.json());

// // Test Route
// app.get("/", (req: Request, res: Response) => {
//   res.status(200).json({
//     success: true,
//     message: "AccessPath TypeScript backend server is running",
//   });
// });

// // MongoDB Connection & Server Start
// const connectDBAndStartServer = async (): Promise<void> => {
//   try {
//     const mongoUri = process.env.MONGO_URI;
//     if (!mongoUri) {
//       throw new Error("MONGO_URI is missing in .env file");
//     }

//     await mongoose.connect(mongoUri);
//     console.log("MongoDB Connected");

//     app.listen(PORT, () => {
//       console.log(`Server is running on http://localhost:${PORT}`);
//     });
//   } catch (error) {
//     const message =
//       error instanceof Error ? error.message : "Unknown database error";
//     console.error("Database connection failed:", message);
//     process.exit(1);
//   }
// };

// connectDBAndStartServer();

import dns from "node:dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

import dotenv from "dotenv";
import express, { Request, Response } from "express";
import mongoose from "mongoose";
import cors from "cors";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "AccessPath TypeScript backend server is running",
  });
});

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