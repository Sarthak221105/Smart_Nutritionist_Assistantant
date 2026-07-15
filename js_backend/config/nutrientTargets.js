// Recommended daily values used by the Nutrient Gap Tracker.
// Values are generic adult FDA Daily Values (DV) — not personalized per user
// age/gender/weight. Tune these here rather than in controller/util code.
export const NUTRIENT_RDA = {
  protein: { label: "Protein", unit: "g", rda: 50 },
  fiber: { label: "Fiber", unit: "g", rda: 28 },
  iron: { label: "Iron", unit: "mg", rda: 18 },
  calcium: { label: "Calcium", unit: "mg", rda: 1300 },
  vitaminD: { label: "Vitamin D", unit: "mcg", rda: 20 },
  vitaminC: { label: "Vitamin C", unit: "mg", rda: 90 },
  potassium: { label: "Potassium", unit: "mg", rda: 4700 },
};

// Deficiency detection thresholds — how "meaningful stretch" is defined.
export const DEFICIENCY_RULES = {
  // A day counts as deficient for a nutrient if intake is below this fraction of its RDA
  deficiencyThresholdRatio: 0.8,
  // "Persistent shortfall": flag if at least this fraction of the last 7 LOGGED days are deficient
  persistentWindowDays: 7,
  minDeficientDayRatio: 0.6,
  // "Declining trend": compare first half vs second half of the last N logged days
  trendWindowDays: 14,
  decliningTrendDropRatio: 0.15,
  // Don't flag anything until the user has logged at least this many distinct days
  minLoggedDaysForFlag: 3,
};

// Plain-language explanations shown alongside a deficiency flag in the UI.
export const NUTRIENT_EXPLANATIONS = {
  protein: "Protein supports muscle repair and keeps you feeling full. Persistently low intake can lead to muscle loss and slower recovery.",
  fiber: "Fiber supports digestion and steady blood sugar. Persistently low intake is linked to digestive issues and higher cholesterol over time.",
  iron: "Iron carries oxygen in your blood. Persistently low intake can lead to fatigue, weakness, and eventually anemia.",
  calcium: "Calcium keeps bones and teeth strong. Persistently low intake over months/years raises the risk of weak bones.",
  vitaminD: "Vitamin D helps your body absorb calcium and supports immune function. Low intake is common and linked to bone and mood issues.",
  vitaminC: "Vitamin C supports immune function and helps your body absorb iron. Persistently low intake can slow wound healing.",
  potassium: "Potassium helps regulate fluid balance and healthy blood pressure. Persistently low intake is linked to muscle cramps and fatigue.",
};
