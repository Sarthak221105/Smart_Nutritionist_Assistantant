import React, { useState, useEffect } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NUTRIENT_FOOD_SUGGESTIONS } from '../data/nutrientFoodSuggestions';

const NODE_BACKEND = import.meta.env.VITE_NODE_BACKEND_URL || 'http://localhost:5000';

// Display-only gate for this widget specifically. Separate from the backend's
// own DEFICIENCY_RULES.minLoggedDaysForFlag (js_backend/config/nutrientTargets.js),
// which gates whether the detection algorithm flags anything at all — that
// value is left untouched since other consumers (Nutrient Trends tab) rely on it.
const MIN_LOGGED_DAYS_FOR_WIDGET = 7;

// Reuses the existing /api/nutrients/trends endpoint — the same rolling
// 7d/30d aggregation and RDA-based deficiency detection already built for
// the Nutrient Gap Tracker (js_backend/utils/nutrientAnalysis.js). No
// duplicate logic here, just a second read of the same data.
const DeficiencyAlerts = () => {
  const { currentUser, getIdToken } = useAuth();
  const [state, setState] = useState({ loading: true, loggedDays: 0, deficiencies: [] });
  const [expandedNutrient, setExpandedNutrient] = useState(null);

  useEffect(() => {
    if (!currentUser) {
      setState({ loading: false, loggedDays: 0, deficiencies: [] });
      return;
    }

    let cancelled = false;
    const load = async () => {
      try {
        const token = await getIdToken();
        if (!token) {
          if (!cancelled) setState({ loading: false, loggedDays: 0, deficiencies: [] });
          return;
        }

        const res = await fetch(`${NODE_BACKEND}/api/nutrients/trends?days=30`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          if (!cancelled) {
            setState({
              loading: false,
              loggedDays: data.dailyTotals.length,
              deficiencies: data.deficiencies,
            });
          }
        } else if (!cancelled) {
          setState({ loading: false, loggedDays: 0, deficiencies: [] });
        }
      } catch (err) {
        console.error('Error loading deficiency alerts:', err);
        if (!cancelled) setState({ loading: false, loggedDays: 0, deficiencies: [] });
      }
    };

    load();
    return () => { cancelled = true; };
  }, [currentUser]);

  // Hidden entirely: still loading, not enough logged history, or nothing deficient
  if (state.loading) return null;
  if (state.loggedDays < MIN_LOGGED_DAYS_FOR_WIDGET) return null;
  if (state.deficiencies.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/30 rounded-3xl p-6 shadow-sm space-y-4">
      <h3 className="font-bold text-lg text-slate-850 dark:text-white flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-rose-500" /> Nutrient Deficiency Alerts
      </h3>

      <div className="space-y-2">
        {state.deficiencies.map((flag) => {
          const isExpanded = expandedNutrient === flag.nutrient;
          const foods = NUTRIENT_FOOD_SUGGESTIONS[flag.nutrient];

          return (
            <div
              key={flag.nutrient}
              className="border border-rose-100 dark:border-rose-950/30 bg-rose-50/50 dark:bg-rose-950/10 rounded-2xl p-3.5"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">
                  {flag.label} is very low this week
                </p>
                <button
                  onClick={() => setExpandedNutrient(isExpanded ? null : flag.nutrient)}
                  className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 flex items-center gap-1 flex-shrink-0"
                  id={`know-more-${flag.nutrient}`}
                >
                  Know more {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {isExpanded && (
                <div className="mt-2.5 pt-2.5 border-t border-rose-100 dark:border-rose-950/30 space-y-1.5 text-xs text-slate-600 dark:text-slate-350 leading-relaxed">
                  <p>{flag.explanation}</p>
                  {foods && (
                    <p>
                      <strong className="text-slate-800 dark:text-slate-200">Try adding:</strong> {foods}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DeficiencyAlerts;
