import DietLog from "../models/DietLog.js";

// Add a diet log for authenticated user
export const addDietLog = async (req, res) => {
  try {
    const diet = await DietLog.create({
      ...req.body,
      userId: req.user._id
    });
    res.status(201).json(diet);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get diet logs of authenticated user
export const getDietLogs = async (req, res) => {
  try {
    const logs = await DietLog.find({ userId: req.user._id }).sort({ date: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a diet log
export const deleteDietLog = async (req, res) => {
  try {
    const log = await DietLog.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!log) return res.status(404).json({ message: "Log not found" });
    res.json({ message: "Log deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
