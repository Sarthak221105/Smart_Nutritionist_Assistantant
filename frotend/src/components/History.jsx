import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2, Search, Filter, Calendar, Award, Apple, Flame, Hash } from 'lucide-react';
import { useNutrition } from '../context/NutritionContext';
import { ConfirmDialog } from './ui/Modal';

const History = () => {
  const { logs, deleteLog } = useNutrition();
  const [searchTerm, setSearchTerm] = useState('');
  const [mealFilter, setMealFilter] = useState('All');
  const [logToDelete, setLogToDelete] = useState(null);

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    const matchesSearch = log.foodItems.some(item => item.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesMeal = mealFilter === 'All' || log.mealType === mealFilter;
    return matchesSearch && matchesMeal;
  });

  // Calculate statistics
  const totalCalories = filteredLogs.reduce((sum, log) => sum + (log.calories || 0), 0);
  const totalProtein = filteredLogs.reduce((sum, log) => sum + (log.protein || 0), 0);
  const totalCarbs = filteredLogs.reduce((sum, log) => sum + (log.carbs || 0), 0);
  const totalFats = filteredLogs.reduce((sum, log) => sum + (log.fats || 0), 0);
  
  const avgCalories = filteredLogs.length > 0 ? Math.round(totalCalories / filteredLogs.length) : 0;
  const avgProtein = filteredLogs.length > 0 ? Math.round(totalProtein / filteredLogs.length) : 0;
  const avgCarbs = filteredLogs.length > 0 ? Math.round(totalCarbs / filteredLogs.length) : 0;
  const avgFats = filteredLogs.length > 0 ? Math.round(totalFats / filteredLogs.length) : 0;

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search logged food items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-850 pl-10 pr-4 py-2.5 rounded-2xl text-sm focus:outline-none focus:border-brand-500 text-slate-800 dark:text-white"
            id="history-search-input"
          />
        </div>

        <div className="flex gap-2 items-center flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-450 font-semibold px-1">
            <Filter className="w-3.5 h-3.5" /> Filter by:
          </div>
          <select
            value={mealFilter}
            onChange={(e) => setMealFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-850 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-slate-650 focus:outline-none focus:border-brand-500"
            id="history-meal-filter"
          >
            <option value="All">All Meals</option>
            <option value="Breakfast">Breakfast</option>
            <option value="Lunch">Lunch</option>
            <option value="Dinner">Dinner</option>
            <option value="Snack">Snacks</option>
          </select>
        </div>
      </div>

      {/* Aggregate Stats Cards */}
      {filteredLogs.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm text-center">
            <Flame className="w-5 h-5 text-accent-orange mx-auto mb-1" />
            <p className="text-[10px] font-semibold text-slate-400 uppercase">Avg Calories</p>
            <p className="text-xl font-bold text-slate-800 dark:text-white font-mono mt-1">{avgCalories} kcal</p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm text-center">
            <Apple className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
            <p className="text-[10px] font-semibold text-slate-400 uppercase">Avg Protein</p>
            <p className="text-xl font-bold text-slate-800 dark:text-white font-mono mt-1">{avgProtein}g</p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm text-center">
            <Award className="w-5 h-5 text-amber-500 mx-auto mb-1" />
            <p className="text-[10px] font-semibold text-slate-400 uppercase">Avg Carbs</p>
            <p className="text-xl font-bold text-slate-800 dark:text-white font-mono mt-1">{avgCarbs}g</p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm text-center">
            <Hash className="w-5 h-5 text-rose-500 mx-auto mb-1" />
            <p className="text-[10px] font-semibold text-slate-400 uppercase">Avg Fats</p>
            <p className="text-xl font-bold text-slate-800 dark:text-white font-mono mt-1">{avgFats}g</p>
          </div>
        </div>
      )}

      {/* Main History Table/Cards Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
            <div className="p-4 bg-slate-50 dark:bg-slate-850 text-slate-350 dark:text-slate-650 rounded-2xl">
              <Calendar className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-slate-850 dark:text-white text-base">No history records found</h4>
              <p className="text-slate-450 text-xs max-w-sm mx-auto">
                No logs match your search details. Try adjusting filters or start adding new meal records.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-850 text-xs font-bold text-slate-450 bg-slate-50/50 dark:bg-slate-900/50">
                  <th className="px-6 py-4">Logged Date & Time</th>
                  <th className="px-6 py-4">Meal Type</th>
                  <th className="px-6 py-4">Food Ingredients</th>
                  <th className="px-6 py-4 text-center">Calories</th>
                  <th className="px-6 py-4 text-center">Protein</th>
                  <th className="px-6 py-4 text-center">Carbs</th>
                  <th className="px-6 py-4 text-center">Fats</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-sm">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/10 transition-colors">
                    <td className="px-6 py-4 text-xs font-medium text-slate-450 whitespace-nowrap">
                      {formatDate(log.date)}
                    </td>
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
                    <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300 capitalize max-w-xs truncate">
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
                        title="Delete record"
                        id={`delete-history-btn-${log.id}`}
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

      <ConfirmDialog
        isOpen={!!logToDelete}
        onClose={() => setLogToDelete(null)}
        onConfirm={() => deleteLog(logToDelete.id)}
        title="Delete Historical Log"
        message={`Are you sure you want to permanently delete this logged meal containing "${logToDelete?.foodItems.join(', ')}" from your history records?`}
        confirmText="Confirm Delete"
        type="danger"
      />
    </div>
  );
};

export default History;
