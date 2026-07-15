import express from "express";
import { getNutrientTrends } from "../controllers/nutrientController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/trends", protect, getNutrientTrends);

export default router;
