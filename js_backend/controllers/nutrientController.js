import DietLog from "../models/DietLog.js";
import { NUTRIENT_RDA } from "../config/nutrientTargets.js";
import { aggregateDailyTotals, computeRollingStats, detectDeficiencies } from "../utils/nutrientAnalysis.js";

// GET /api/nutrients/trends — daily series + rolling stats + deficiency flags
// for the authenticated user, over the last `days` days (default 30).
export const getNutrientTrends = async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days, 10) || 30, 90);
    const since = new Date();
    since.setDate(since.getDate() - days);

    const logs = await DietLog.find({
      userId: req.user._id,
      date: { $gte: since },
    }).sort({ date: 1 });

    const dailyTotals = aggregateDailyTotals(logs);

    res.json({
      rda: NUTRIENT_RDA,
      dailyTotals,
      rolling7Day: computeRollingStats(dailyTotals, 7),
      rolling30Day: computeRollingStats(dailyTotals, 30),
      deficiencies: detectDeficiencies(dailyTotals),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
