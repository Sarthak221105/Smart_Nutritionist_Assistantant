import express from "express";
import {
  getRecommendations,
  addRecommendation,
} from "../controllers/recommendationController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();


router.get("/:userId", protect, getRecommendations);


router.post("/", protect, addRecommendation);

export default router;
