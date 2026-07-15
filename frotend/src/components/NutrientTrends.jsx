import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { AlertTriangle, TrendingDown, Repeat, ActivitySquare, CalendarRange } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NODE_BACKEND = import.meta.env.VITE_NODE_BACKEND_URL || 'http://localhost:5000';

const PATTERN_META = {
  persistent_shortfall: { label: 'Persistent Shortfall', icon: AlertTriangle },
  declining_trend: { label: 'Declining Trend', icon: TrendingDown },
  persistent_and_declining: { label: 'Persistent & Declining', icon: Repeat },
};

const NutrientTrends = () => {
  const { getIdToken } = useAuth();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTrends = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = await getIdToken();
        if (!token) {
          setError('Please sign in again to view your nutrient trends.');
          return;
        }

        const res = await fetch(`${NODE_BACKEND}/api/nutrients/trends?days=30`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || 'Failed to load nutrient trends');
        }

        setData(await res.json());
      } catch (err) {
        console.error('Error loading nutrient trends:', err);
        setError('Could not load nutrient trends. Please try again shortly.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrends();
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-slate-100 dark:bg-slate-850 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm text-center text-sm text-slate-450">
        {error}
      </div>
    );
  }

  const { rda, dailyTotals, rolling7Day, rolling30Day, deficiencies } = data;
  const nutrientKeys = Object.keys(rda);

  const deficiencyByNutrient = Object.fromEntries(deficiencies.map((flag) => [flag.nutrient, flag]));

  if (dailyTotals.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center flex flex-col items-center justify-center space-y-3 shadow-sm">
        <div className="p-4 bg-slate-50 dark:bg-slate-850 text-slate-350 dark:text-slate-600 rounded-2xl">
          <ActivitySquare className="w-10 h-10" />
        </div>
        <h4 className="font-bold text-slate-850 dark:text-white text-base">No logged meals yet</h4>
        <p className="text-slate-400 text-xs max-w-sm">
          Analyze a meal and add it to your daily log to start building your nutrient trend history.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Deficiency summary banner */}
      {deficiencies.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/15 border border-amber-200 dark:border-amber-900/30 rounded-3xl p-5 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-amber-800 dark:text-amber-300">
              {deficiencies.length} nutrient{deficiencies.length > 1 ? 's' : ''} showing a deficiency pattern
            </h4>
            <p className="text-xs text-amber-700/80 dark:text-amber-400/80">
              Based on your last {dailyTotals.length} logged day{dailyTotals.length > 1 ? 's' : ''}. See details below each chart.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {nutrientKeys.map((key, idx) => {
          const meta = rda[key];
          const flag = deficiencyByNutrient[key];
          const patternMeta = flag ? PATTERN_META[flag.pattern] : null;
          const PatternIcon = patternMeta?.icon;

          const chartData = dailyTotals.map((day) => ({
            date: day.date.slice(5), // MM-DD
            value: day[key],
          }));

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: idx * 0.04 }}
              className={`bg-white dark:bg-slate-900 border rounded-3xl p-6 shadow-sm space-y-4 ${
                flag ? 'border-amber-200 dark:border-amber-900/40' : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h4 className="font-bold text-sm text-slate-850 dark:text-white">{meta.label}</h4>
                  <p className="text-[10px] text-slate-400 flex items-center gap-1">
                    <CalendarRange className="w-3 h-3" /> RDA target: {meta.rda} {meta.unit}/day
                  </p>
                </div>
                {flag && (
                  <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 px-2.5 py-1 rounded-full flex items-center gap-1">
                    {PatternIcon && <PatternIcon className="w-3 h-3" />} {patternMeta.label}
                  </span>
                )}
              </div>

              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100 dark:stroke-slate-800" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip
                      formatter={(value) => [`${value} ${meta.unit}`, meta.label]}
                      contentStyle={{ fontSize: 12, borderRadius: 12 }}
                    />
                    <ReferenceLine y={meta.rda} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'RDA', fontSize: 10, position: 'insideTopRight' }} />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={flag ? '#f43f5e' : '#10b981'}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-100 dark:border-slate-800 pt-3">
                <div className="bg-slate-50 dark:bg-slate-850 rounded-xl p-2.5 text-center">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">7-Day Avg</p>
                  <p className="font-bold text-slate-800 dark:text-white font-mono">
                    {rolling7Day[key].average} {meta.unit}
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-850 rounded-xl p-2.5 text-center">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">30-Day Avg</p>
                  <p className="font-bold text-slate-800 dark:text-white font-mono">
                    {rolling30Day[key].average} {meta.unit}
                  </p>
                </div>
              </div>

              {flag && (
                <p className="text-[11px] leading-relaxed text-amber-800/90 dark:text-amber-350/90 bg-amber-50/60 dark:bg-amber-950/10 rounded-xl p-3">
                  {flag.explanation}
                </p>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default NutrientTrends;
