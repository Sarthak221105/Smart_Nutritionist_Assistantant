import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Calendar, Target, Flame, Egg, ChefHat, Dumbbell, Droplets } from 'lucide-react';
import { useNutrition } from '../context/NutritionContext';
import { ConfirmDialog } from './ui/Modal';
import DeficiencyAlerts from './DeficiencyAlerts';

const Dashboard = ({ setActiveTab }) => {
  const { logs, profile, deleteLog, addLog } = useNutrition();
  const [logToDelete, setLogToDelete] = useState(null);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickMeal, setQuickMeal] = useState({
    mealType: 'Lunch',
    foodName: '',
    calories: 300,
    protein: 20,
    carbs: 35,
    fats: 8
  });

  // Calculate today's totals
  const today = new Date().toDateString();
  const todayLogs = logs.filter(log => new Date(log.date).toDateString() === today);

  const totalCalories = todayLogs.reduce((acc, log) => acc + (log.calories || 0), 0);
  const totalProtein = todayLogs.reduce((acc, log) => acc + (log.protein || 0), 0);
  const totalCarbs = todayLogs.reduce((acc, log) => acc + (log.carbs || 0), 0);
  const totalFats = todayLogs.reduce((acc, log) => acc + (log.fats || 0), 0);

  // Targets
  const calorieTarget = profile.dailyCalorieTarget || 2000;
  const proteinTarget = profile.dailyProteinTarget || 120;
  const carbsTarget = profile.dailyCarbsTarget || 220;
  const fatsTarget = profile.dailyFatsTarget || 65;

  // Percentage calculations
  const calPercent = Math.min(Math.round((totalCalories / calorieTarget) * 100), 100);
  const proteinPercent = Math.min(Math.round((totalProtein / proteinTarget) * 100), 100);
  const carbsPercent = Math.min(Math.round((totalCarbs / carbsTarget) * 100), 100);
  const fatsPercent = Math.min(Math.round((totalFats / fatsTarget) * 100), 100);

  const handleQuickAdd = (e) => {
    e.preventDefault();
    if (!quickMeal.foodName) return;

    addLog({
      mealType: quickMeal.mealType,
      foodItems: [quickMeal.foodName.toLowerCase()],
      calories: Number(quickMeal.calories),
      protein: Number(quickMeal.protein),
      carbs: Number(quickMeal.carbs),
      fats: Number(quickMeal.fats)
    });

    setQuickMeal({
      mealType: 'Lunch',
      foodName: '',
      calories: 300,
      protein: 20,
      carbs: 35,
      fats: 8
    });
    setQuickAddOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-brand-600 to-emerald-500 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 bottom-0 top-0 opacity-15 translate-x-10 pointer-events-none">
          <ChefHat className="w-64 h-64 text-white" />
        </div>
        <div className="relative z-10 max-w-xl space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold font-sans text-white">Hello, {profile.name}! 👋</h2>
          <p className="text-emerald-50 text-sm md:text-base">
            Your diet is tracking well today. You have consumed <strong>{totalCalories} kcal</strong> of your <strong>{calorieTarget} kcal</strong> budget. Let's make healthy choices!
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              onClick={() => setActiveTab('scanner')}
              className="bg-white text-brand-700 hover:bg-emerald-50 px-4 py-2 rounded-xl text-sm font-semibold transition-all transform hover:scale-[1.03] shadow-md flex items-center gap-1.5"
              id="analyze-food-btn"
            >
              <Plus className="w-4 h-4" /> AI Food Analysis
            </button>
            <button
              onClick={() => setQuickAddOpen(true)}
              className="bg-brand-700/40 text-emerald-50 border border-brand-500/30 hover:bg-brand-700/60 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
              id="quick-add-btn"
            >
              Quick Add Log
            </button>
          </div>
        </div>
      </div>

      <DeficiencyAlerts />

      {/* Progress Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calorie Ring Gauge Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="w-full flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-850 dark:text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-accent-orange" /> Calorie Tracker
            </h3>
            <span className="text-xs text-slate-400 font-medium">Daily Budget</span>
          </div>

          <div className="relative w-40 h-40 flex items-center justify-center">
            {/* SVG Circle Gauge */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="68"
                className="stroke-slate-100 dark:stroke-slate-800 fill-none"
                strokeWidth="12"
              />
              <motion.circle
                cx="80"
                cy="80"
                r="68"
                className="stroke-brand-550 fill-none"
                strokeWidth="12"
                strokeDasharray={2 * Math.PI * 68}
                initial={{ strokeDashoffset: 2 * Math.PI * 68 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 68 * (1 - calPercent / 100) }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold text-slate-800 dark:text-white">{totalCalories}</span>
              <span className="text-xs text-slate-400">/ {calorieTarget} kcal</span>
            </div>
          </div>
          <p className="mt-4 text-xs font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/40 px-3 py-1 rounded-full">
            {100 - calPercent <= 0 ? 'Budget reached!' : `${calorieTarget - totalCalories} kcal remaining`}
          </p>
        </div>

        {/* Macronutrients Progress Bars Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between col-span-1 lg:col-span-2">
          <div className="w-full flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-850 dark:text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-brand-500" /> Macronutrient Balance
            </h3>
            <span className="text-xs text-slate-400 font-medium">Goal Alignment</span>
          </div>

          <div className="space-y-4 py-2">
            {/* Protein */}
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  Protein
                </span>
                <span className="text-slate-500 font-mono">
                  {totalProtein}g <span className="text-xs text-slate-400">/ {proteinTarget}g</span>
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-3.5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${proteinPercent}%` }}
                  transition={{ duration: 1 }}
                  className="bg-emerald-500 h-full rounded-full"
                />
              </div>
            </div>

            {/* Carbs */}
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  Carbs
                </span>
                <span className="text-slate-500 font-mono">
                  {totalCarbs}g <span className="text-xs text-slate-400">/ {carbsTarget}g</span>
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-3.5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${carbsPercent}%` }}
                  transition={{ duration: 1, delay: 0.1 }}
                  className="bg-amber-500 h-full rounded-full"
                />
              </div>
            </div>

            {/* Fats */}
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  Fats
                </span>
                <span className="text-slate-500 font-mono">
                  {totalFats}g <span className="text-xs text-slate-400">/ {fatsTarget}g</span>
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-3.5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${fatsPercent}%` }}
                  transition={{ duration: 1, delay: 0.2 }}
                  className="bg-rose-500 h-full rounded-full"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-400">
            <div>
              <p className="font-bold text-slate-700 dark:text-slate-300">{proteinTarget - totalProtein > 0 ? `${Math.round(proteinTarget - totalProtein)}g` : '0g'}</p>
              <p>Protein left</p>
            </div>
            <div>
              <p className="font-bold text-slate-700 dark:text-slate-300">{carbsTarget - totalCarbs > 0 ? `${Math.round(carbsTarget - totalCarbs)}g` : '0g'}</p>
              <p>Carbs left</p>
            </div>
            <div>
              <p className="font-bold text-slate-700 dark:text-slate-300">{fatsTarget - totalFats > 0 ? `${Math.round(fatsTarget - totalFats)}g` : '0g'}</p>
              <p>Fats left</p>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Logs Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3">
          <div className="space-y-1">
            <h3 className="font-bold text-lg text-slate-850 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-slate-500" /> Today's Meal Log
            </h3>
            <p className="text-xs text-slate-400">Logged meals and nutritional inputs for today</p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full">
            {todayLogs.length} {todayLogs.length === 1 ? 'meal' : 'meals'} recorded
          </span>
        </div>

        {todayLogs.length === 0 ? (
          <div className="p-8 md:p-12 text-center flex flex-col items-center justify-center space-y-3">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 text-brand-600 dark:text-brand-400 rounded-2xl">
              <ChefHat className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-slate-850 dark:text-white text-base">No meals logged yet today</h4>
              <p className="text-slate-400 text-xs max-w-sm">Use our AI Food Vision scanner or manually input ingredients to track your nutritional progress.</p>
            </div>
            <button
              onClick={() => setActiveTab('scanner')}
              className="mt-2 bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-emerald-600/10 transition-colors"
              id="empty-log-btn"
            >
              Analyze Your First Meal
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-850 text-xs font-bold text-slate-400 bg-slate-50/50 dark:bg-slate-900/50">
                  <th className="px-6 py-4">Meal Type</th>
                  <th className="px-6 py-4">Food Items</th>
                  <th className="px-6 py-4 text-center">Calories</th>
                  <th className="px-6 py-4 text-center">Protein</th>
                  <th className="px-6 py-4 text-center">Carbs</th>
                  <th className="px-6 py-4 text-center">Fats</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-sm">
                {todayLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        log.mealType === 'Breakfast'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                          : log.mealType === 'Lunch'
                          ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/20 dark:text-brand-400'
                          : log.mealType === 'Dinner'
                          ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400'
                          : 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400'
                      }`}>
                        {log.mealType}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-350 capitalize max-w-xs truncate">
                      {log.foodItems.join(', ')}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-slate-800 dark:text-white font-mono">
                      {log.calories} <span className="text-[10px] text-slate-400 font-normal">kcal</span>
                    </td>
                    <td className="px-6 py-4 text-center text-slate-600 dark:text-slate-350 font-mono">
                      {log.protein}g
                    </td>
                    <td className="px-6 py-4 text-center text-slate-600 dark:text-slate-350 font-mono">
                      {log.carbs}g
                    </td>
                    <td className="px-6 py-4 text-center text-slate-600 dark:text-slate-350 font-mono">
                      {log.fats}g
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setLogToDelete(log)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-all"
                        title="Delete meal log"
                        id={`delete-btn-${log.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Add Log Dialog Modal */}
      {quickAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setQuickAddOpen(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl shadow-2xl p-6 relative z-10 space-y-4"
          >
            <h3 className="font-bold text-lg text-slate-850 dark:text-white">Quick Add Meal Log</h3>
            <form onSubmit={handleQuickAdd} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Meal Type</label>
                <select
                  value={quickMeal.mealType}
                  onChange={(e) => setQuickMeal({ ...quickMeal, mealType: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-850 px-3 py-2 rounded-xl text-sm text-slate-800 dark:text-white"
                >
                  <option>Breakfast</option>
                  <option>Lunch</option>
                  <option>Dinner</option>
                  <option>Snack</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Food Item Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Scrambled Eggs & Toast"
                  value={quickMeal.foodName}
                  onChange={(e) => setQuickMeal({ ...quickMeal, foodName: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-850 px-3 py-2 rounded-xl text-sm focus:outline-none focus:border-brand-500 text-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Calories (kcal)</label>
                  <input
                    type="number"
                    min="0"
                    value={quickMeal.calories}
                    onChange={(e) => setQuickMeal({ ...quickMeal, calories: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-850 px-3 py-2 rounded-xl text-sm focus:outline-none focus:border-brand-500 text-slate-800 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Protein (g)</label>
                  <input
                    type="number"
                    min="0"
                    value={quickMeal.protein}
                    onChange={(e) => setQuickMeal({ ...quickMeal, protein: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-850 px-3 py-2 rounded-xl text-sm focus:outline-none focus:border-brand-500 text-slate-800 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Carbs (g)</label>
                  <input
                    type="number"
                    min="0"
                    value={quickMeal.carbs}
                    onChange={(e) => setQuickMeal({ ...quickMeal, carbs: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-850 px-3 py-2 rounded-xl text-sm focus:outline-none focus:border-brand-500 text-slate-800 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Fats (g)</label>
                  <input
                    type="number"
                    min="0"
                    value={quickMeal.fats}
                    onChange={(e) => setQuickMeal({ ...quickMeal, fats: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-850 px-3 py-2 rounded-xl text-sm focus:outline-none focus:border-brand-500 text-slate-800 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setQuickAddOpen(false)}
                  className="flex-1 border border-slate-200 dark:border-slate-700 py-2 rounded-xl text-sm font-medium text-slate-650 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-brand-600 hover:bg-brand-700 text-white py-2 rounded-xl text-sm font-semibold transition-colors"
                >
                  Add Log
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Confirmation Dialog for deletion */}
      <ConfirmDialog
        isOpen={!!logToDelete}
        onClose={() => setLogToDelete(null)}
        onConfirm={() => deleteLog(logToDelete.id)}
        title="Remove Meal Log"
        message={`Are you sure you want to remove "${logToDelete?.foodItems.join(', ')}" from your daily intake log? This action cannot be undone.`}
        confirmText="Remove Log"
        type="danger"
      />
    </div>
  );
};

export default Dashboard;
