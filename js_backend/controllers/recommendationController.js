import Recommendation from "../models/Recommendation.js";

export const getRecommendations = async (req, res) => {
  try {
    const recs = await Recommendation.find({ userId: req.params.userId });
    res.json(recs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addRecommendation = async (req, res) => {
  try {
    const rec = await Recommendation.create(req.body);
    res.status(201).json(rec);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
