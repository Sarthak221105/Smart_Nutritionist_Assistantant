import { NUTRIENT_RDA, DEFICIENCY_RULES, NUTRIENT_EXPLANATIONS } from "../config/nutrientTargets.js";

const NUTRIENT_KEYS = Object.keys(NUTRIENT_RDA);

const dateKey = (date) => new Date(date).toISOString().slice(0, 10);

const nutrientValue = (log, key) => {
  if (key === "protein") {
    // Prefer the accurate USDA-derived value now persisted in nutrients.protein
    // (see DietLog.js). Fall back to the legacy top-level field for logs created
    // before that existed, and for manual Quick Add entries which never populate
    // `nutrients` at all but do set `protein` directly from user input.
    if (log.nutrients && log.nutrients.protein != null) return log.nutrients.protein;
    return log.protein || 0;
  }
  return (log.nutrients && log.nutrients[key]) || 0;
};

// Groups diet logs by calendar day and sums each tracked nutrient.
// Only days that have at least one logged meal appear in the result.
export const aggregateDailyTotals = (logs) => {
  const byDay = new Map();

  for (const log of logs) {
    const day = dateKey(log.date);
    if (!byDay.has(day)) {
      const empty = { date: day };
      NUTRIENT_KEYS.forEach((key) => (empty[key] = 0));
      byDay.set(day, empty);
    }
    const totals = byDay.get(day);
    NUTRIENT_KEYS.forEach((key) => {
      totals[key] += nutrientValue(log, key);
    });
  }

  return Array.from(byDay.values()).sort((a, b) => (a.date < b.date ? -1 : 1));
};

// Rolling total + average over the most recent `days` logged days.
export const computeRollingStats = (dailyTotals, days) => {
  const recent = dailyTotals.slice(-days);
  const stats = {};
  NUTRIENT_KEYS.forEach((key) => {
    const total = recent.reduce((sum, day) => sum + day[key], 0);
    stats[key] = {
      total: Math.round(total * 10) / 10,
      average: recent.length ? Math.round((total / recent.length) * 10) / 10 : 0,
      daysCounted: recent.length,
    };
  });
  return stats;
};

// Flags nutrients that show either a persistent shortfall (below RDA on most
// of the last N logged days) or a declining trend across the last N days.
export const detectDeficiencies = (dailyTotals) => {
  const rules = DEFICIENCY_RULES;
  const flags = [];

  if (dailyTotals.length < rules.minLoggedDaysForFlag) {
    return flags;
  }

  NUTRIENT_KEYS.forEach((key) => {
    const rda = NUTRIENT_RDA[key].rda;
    const deficiencyLine = rda * rules.deficiencyThresholdRatio;

    // Rule A: persistent shortfall over the recent window
    const persistentWindow = dailyTotals.slice(-rules.persistentWindowDays);
    const deficientDays = persistentWindow.filter((day) => day[key] < deficiencyLine).length;
    const deficientRatio = persistentWindow.length ? deficientDays / persistentWindow.length : 0;
    const persistentShortfall = deficientRatio >= rules.minDeficientDayRatio;

    // Rule B: declining trend over a longer window
    const trendWindow = dailyTotals.slice(-rules.trendWindowDays);
    let decliningTrend = false;
    if (trendWindow.length >= 4) {
      const mid = Math.floor(trendWindow.length / 2);
      const firstHalf = trendWindow.slice(0, mid);
      const secondHalf = trendWindow.slice(mid);
      const avg = (arr) => arr.reduce((sum, day) => sum + day[key], 0) / arr.length;
      const firstAvg = avg(firstHalf);
      const secondAvg = avg(secondHalf);
      const drop = firstAvg > 0 ? (firstAvg - secondAvg) / firstAvg : 0;
      decliningTrend = secondAvg < rda && drop >= rules.decliningTrendDropRatio;
    }

    if (persistentShortfall || decliningTrend) {
      flags.push({
        nutrient: key,
        label: NUTRIENT_RDA[key].label,
        unit: NUTRIENT_RDA[key].unit,
        rda,
        pattern: persistentShortfall && decliningTrend
          ? "persistent_and_declining"
          : persistentShortfall
            ? "persistent_shortfall"
            : "declining_trend",
        explanation: NUTRIENT_EXPLANATIONS[key],
      });
    }
  });

  return flags;
};
