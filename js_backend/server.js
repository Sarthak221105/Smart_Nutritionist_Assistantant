import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./db.js";

import authRoutes from "./routes/authRoutes.js";
import dietRoutes from "./routes/dietRoutes.js";
import recommendationRoutes from "./routes/recommendationRoutes.js";
import nutritionRoutes from "./routes/nutritionRoutes.js";


dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect DB
connectDB();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/diet", dietRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/nutrition", nutritionRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
