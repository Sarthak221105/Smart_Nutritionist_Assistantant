import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Eye, Save, Settings as SettingsIcon, AlertCircle, Dumbbell } from 'lucide-react';
import { useNutrition } from '../context/NutritionContext';

const Settings = () => {
  const { profile, updateProfile } = useNutrition();
  const [formData, setFormData] = useState({ ...profile });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfile(formData);
  };

  const handleAllergyToggle = (allergy) => {
    const list = formData.allergies;
    const newAllergies = list.includes(allergy) ? list.filter(a => a !== allergy) : [...list, allergy];
    setFormData({ ...formData, allergies: newAllergies });
  };

  const handleRestrictionToggle = (restriction) => {
    const list = formData.restrictions;
    const newRestrictions = list.includes(restriction) ? list.filter(r => r !== restriction) : [...list, restriction];
    setFormData({ ...formData, restrictions: newRestrictions });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Settings Form Panel (8 cols) */}
      <form onSubmit={handleSubmit} className="lg:col-span-8 space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="space-y-1">
            <h3 className="font-bold text-lg text-slate-850 dark:text-white flex items-center gap-2">
              <User className="text-brand-550 w-5 h-5" /> Profile Settings & Metrics
            </h3>
            <p className="text-xs text-slate-400">Configure your physiological variables for custom AI nutrition goals</p>
          </div>

          {/* Core physiological values */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Full Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-850 px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:border-brand-500 text-slate-800 dark:text-white"
                id="settings-name-input"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Age (Years)</label>
              <input
                type="number"
                min="1"
                required
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-850 px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:border-brand-500 text-slate-800 dark:text-white font-mono"
                id="settings-age-input"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-850 px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:border-brand-500 text-slate-800 dark:text-white font-semibold"
                id="settings-gender-input"
              >
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Height (cm)</label>
              <input
                type="number"
                min="50"
                required
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: Number(e.target.value) })}
                className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-850 px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:border-brand-500 text-slate-800 dark:text-white font-mono"
                id="settings-height-input"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Weight (kg)</label>
              <input
                type="number"
                min="20"
                required
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: Number(e.target.value) })}
                className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-850 px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:border-brand-500 text-slate-800 dark:text-white font-mono"
                id="settings-weight-input"
              />
            </div>
          </div>

          {/* Goal selection & Diet type */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 dark:border-slate-800 pt-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Primary Body Goal</label>
              <select
                value={formData.goal}
                onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-850 px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:border-brand-500 text-slate-800 dark:text-white font-semibold"
                id="settings-goal-input"
              >
                <option value="lose">Lose Weight</option>
                <option value="maintain">Maintain Weight</option>
                <option value="gain">Gain Weight</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Diet Type</label>
              <select
                value={formData.dietType}
                onChange={(e) => setFormData({ ...formData, dietType: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-850 px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:border-brand-500 text-slate-800 dark:text-white font-semibold"
                id="settings-diet-input"
              >
                <option value="non-veg">Non-Vegetarian</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="vegan">Vegan</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Cuisine Preference</label>
              <select
                value={formData.cuisinePreference}
                onChange={(e) => setFormData({ ...formData, cuisinePreference: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-850 px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:border-brand-500 text-slate-800 dark:text-white font-semibold"
                id="settings-cuisine-input"
              >
                <option>Any</option>
                <option>Mediterranean</option>
                <option>Asian</option>
                <option>Mexican</option>
                <option>Italian</option>
                <option>Indian</option>
              </select>
            </div>
          </div>

          {/* Allergies & Dietary restrictions */}
          <div className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2">Base Allergies</label>
              <div className="flex flex-wrap gap-2">
                {['nuts', 'dairy', 'eggs', 'seafood', 'soy', 'wheat'].map((allergy) => {
                  const active = formData.allergies.includes(allergy);
                  return (
                    <button
                      key={allergy}
                      type="button"
                      onClick={() => handleAllergyToggle(allergy)}
                      className={`px-3.5 py-2 rounded-xl border text-xs font-semibold capitalize transition-all ${
                        active
                          ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/20 dark:border-rose-950/40 dark:text-rose-400'
                          : 'bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {allergy}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2">Dietary Restrictions</label>
              <div className="flex flex-wrap gap-2">
                {['low-carb', 'high-protein', 'gluten-free', 'dairy-free', 'low-fat', 'keto'].map((restriction) => {
                  const active = formData.restrictions.includes(restriction);
                  return (
                    <button
                      key={restriction}
                      type="button"
                      onClick={() => handleRestrictionToggle(restriction)}
                      className={`px-3.5 py-2 rounded-xl border text-xs font-semibold capitalize transition-all ${
                        active
                          ? 'bg-brand-50 border-brand-200 text-brand-700 dark:bg-brand-950/20 dark:border-brand-950/40 dark:text-brand-400'
                          : 'bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {restriction}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Submit button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm px-6 py-3 rounded-2xl shadow-lg shadow-emerald-500/10 transition-all flex items-center gap-1.5 transform active:scale-95"
              id="save-settings-btn"
            >
              <Save className="w-4 h-4" /> Save Preferences
            </button>
          </div>
        </div>
      </form>

      {/* Target calculation panel (4 cols) */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="space-y-1">
            <h3 className="font-bold text-lg text-slate-850 dark:text-white flex items-center gap-2">
              <SettingsIcon className="text-brand-550 w-5 h-5 animate-spin-slow" /> Target Calculations
            </h3>
            <p className="text-xs text-slate-400">Calculated target intakes based on current profile</p>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl space-y-1">
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Daily Calorie Target</span>
              <p className="text-2xl font-extrabold text-slate-800 dark:text-white font-mono">{profile.dailyCalorieTarget} <span className="text-sm font-normal text-slate-400">kcal/day</span></p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-2">
                <span className="text-slate-450 font-medium">Daily Protein Goal</span>
                <span className="font-bold text-slate-700 dark:text-slate-250 font-mono">{profile.dailyProteinTarget}g</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-2">
                <span className="text-slate-450 font-medium">Daily Carbohydrates Goal</span>
                <span className="font-bold text-slate-700 dark:text-slate-250 font-mono">{profile.dailyCarbsTarget}g</span>
              </div>
              <div className="flex items-center justify-between pb-1">
                <span className="text-slate-450 font-medium">Daily Fats Goal</span>
                <span className="font-bold text-slate-700 dark:text-slate-250 font-mono">{profile.dailyFatsTarget}g</span>
              </div>
            </div>

            <div className="bg-brand-50/50 dark:bg-brand-950/20 border border-brand-100 dark:border-brand-900/30 rounded-2xl p-4 flex gap-3 items-start">
              <AlertCircle className="w-5 h-5 text-brand-600 dark:text-brand-400 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed text-brand-800 dark:text-brand-350">
                Nutritional targets are automatically computed using the Mifflin-St Jeor formula adjusted for weight goal levels. Consuming these ratios fuels steady metabolic health.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
