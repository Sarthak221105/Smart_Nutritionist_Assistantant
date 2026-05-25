import mongoose from "mongoose";

const recommendationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  date: { type: Date, default: Date.now },
  context: String, 
  message: String, 
});

const Recommendation = mongoose.model("Recommendation", recommendationSchema);
export default Recommendation;
