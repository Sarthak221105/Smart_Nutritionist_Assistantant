import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  firebaseUid: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String }, // Optional as Firebase handles auth
  age: Number,
  gender: String,
  height: Number,
  weight: Number,
  goal: { type: String, default: "lose" },
  dietType: { type: String, default: "non-veg" },
  allergies: { type: [String], default: [] },
  restrictions: { type: [String], default: [] },
  cuisinePreference: { type: String, default: "Any" },
  dailyCalorieTarget: { type: Number, default: 2000 },
  dailyProteinTarget: { type: Number, default: 130 },
  dailyCarbsTarget: { type: Number, default: 200 },
  dailyFatsTarget: { type: Number, default: 60 }
});

const User = mongoose.model("User", userSchema);
export default User;
