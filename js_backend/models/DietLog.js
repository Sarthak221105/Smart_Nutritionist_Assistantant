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
});

const DietLog = mongoose.model("DietLog", dietLogSchema);
export default DietLog;
