import express from "express";
import { addDietLog, getDietLogs, deleteDietLog } from "../controllers/dietController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, addDietLog);
router.get("/", protect, getDietLogs);
router.delete("/:id", protect, deleteDietLog);

export default router;
