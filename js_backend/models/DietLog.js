import mongoose from "mongoose";

const dietLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId, ref: "User"
  },
  date: {
    type: Date, default: Date.now
  },
  mealType: String,
  foodItems: [String],
  calories: Number,
  protein: Number,
  carbs: Number,
  fats: Number,
  // Micronutrient breakdown from the AI analysis, used by the Nutrient Gap Tracker.
  // Optional — older logs and manual quick-adds may not have this.
  nutrients: {
    protein: Number,
    fiber: Number,
    iron: Number,
    calcium: Number,
    vitaminD: Number,
    vitaminC: Number,
    potassium: Number,
  },
});

const DietLog = mongoose.model("DietLog", dietLogSchema);
export default DietLog;
