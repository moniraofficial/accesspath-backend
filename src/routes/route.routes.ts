import { Router } from "express";
import { discover } from "../controllers/route.controller.js";

const router = Router();

router.post("/discover", discover);

export default router;
