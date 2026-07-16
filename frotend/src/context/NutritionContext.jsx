import React, { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from './AuthContext';

const NutritionContext = createContext(null);

// Backend URLs — use env vars in production, fallback to localhost for dev
const NODE_BACKEND = import.meta.env.VITE_NODE_BACKEND_URL || 'http://localhost:5000';
const PYTHON_BACKEND = import.meta.env.VITE_PYTHON_BACKEND_URL || 'http://localhost:5001';

const DEFAULT_PROFILE = {
  name: 'Guest User',
  age: 28,
  gender: 'Male',
  height: 180, // cm
  weight: 78, // kg
  goal: 'lose', // lose, maintain, gain
  dietType: 'non-veg', // vegetarian, vegan, non-veg
  allergies: [], // nuts, dairy, etc.
  restrictions: [], // low-carb, high-protein, etc.
  cuisinePreference: 'Any',
  dailyCalorieTarget: 2000,
  dailyProteinTarget: 130,
  dailyCarbsTarget: 200,
  dailyFatsTarget: 60,
};

export const NutritionProvider = ({ children }) => {
  const { currentUser, getIdToken } = useAuth();
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [logs, setLogs] = useState([]);
  const [toasts, setToasts] = useState([]);

  // Lives here (not in MealScanner's local state) so an in-progress analysis
  // survives the user navigating to a different tab. MealScanner unmounts on
  // tab switch (App.jsx only renders the active tab's component), which would
  // otherwise destroy local state and silently drop the result when the
  // request resolved after the component was already gone.
  const [scanState, setScanState] = useState({ isLoading: false, result: null, error: null });

  // Load profile and logs from MongoDB on user sign-in
  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) {
        setProfile(DEFAULT_PROFILE);
        setLogs([]);
        return;
      }

      try {
        const token = await getIdToken();
        if (!token) return;

        const authHeaders = { headers: { 'Authorization': `Bearer ${token}` } };

        // Profile and diet logs are independent of each other — fetch them
        // concurrently instead of one-after-another (each also pays its own
        // Firebase token verification round-trip server-side, so running them
        // sequentially was paying that cost twice in a row).
        const [profileRes, logsRes] = await Promise.all([
          fetch(`${NODE_BACKEND}/api/auth/profile`, authHeaders),
          fetch(`${NODE_BACKEND}/api/diet`, authHeaders),
        ]);

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfile(profileData);
        }

        if (logsRes.ok) {
          const logsData = await logsRes.json();
          // Map Mongo _id to id property for frontend UI lists
          const mappedLogs = logsData.map(log => ({
            ...log,
            id: log._id
          }));
          setLogs(mappedLogs);
        }
      } catch (err) {
        console.error("Error loading data from MongoDB:", err);
        showToast("Error loading profile from database", "error");
      }
    };

    fetchUserData();
  }, [currentUser]);

  const showToast = (message, type = 'success') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const addLog = async (mealLog) => {
    try {
      const token = await getIdToken();
      if (!token) {
        showToast("Authentication token expired", "error");
        return;
      }

      const res = await fetch(`${NODE_BACKEND}/api/diet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(mealLog)
      });

      if (res.ok) {
        const savedLog = await res.json();
        const mappedLog = { ...savedLog, id: savedLog._id };
        setLogs((prev) => [mappedLog, ...prev]);
        showToast(`Added ${mappedLog.mealType || 'Meal'} to your daily log!`);
        return mappedLog;
      } else {
        showToast("Failed to save meal to database", "error");
      }
    } catch (err) {
      console.error("Add log error:", err);
      showToast("Network error saving meal log", "error");
    }
  };

  const deleteLog = async (id) => {
    try {
      const token = await getIdToken();
      if (!token) return;

      const res = await fetch(`${NODE_BACKEND}/api/diet/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setLogs((prev) => prev.filter((log) => log.id !== id));
        showToast('Meal log removed successfully.', 'info');
      } else {
        showToast("Failed to delete meal log", "error");
      }
    } catch (err) {
      console.error("Delete log error:", err);
      showToast("Network error deleting meal log", "error");
    }
  };

  const updateProfile = async (newProfile) => {
    // Calculate targets locally
    let calorieTarget = 2000;
    let proteinTarget = 120;
    let carbsTarget = 220;
    let fatsTarget = 65;

    const baseCal = (10 * newProfile.weight) + (6.25 * newProfile.height) - (5 * newProfile.age) + 5;

    if (newProfile.goal === 'lose') {
      calorieTarget = Math.round(baseCal * 1.2 - 500);
      proteinTarget = Math.round(newProfile.weight * 2.0);
      fatsTarget = Math.round((calorieTarget * 0.25) / 9);
      carbsTarget = Math.round((calorieTarget - (proteinTarget * 4) - (fatsTarget * 9)) / 4);
    } else if (newProfile.goal === 'gain') {
      calorieTarget = Math.round(baseCal * 1.4 + 300);
      proteinTarget = Math.round(newProfile.weight * 2.2);
      fatsTarget = Math.round((calorieTarget * 0.28) / 9);
      carbsTarget = Math.round((calorieTarget - (proteinTarget * 4) - (fatsTarget * 9)) / 4);
    } else {
      calorieTarget = Math.round(baseCal * 1.3);
      proteinTarget = Math.round(newProfile.weight * 1.8);
      fatsTarget = Math.round((calorieTarget * 0.25) / 9);
      carbsTarget = Math.round((calorieTarget - (proteinTarget * 4) - (fatsTarget * 9)) / 4);
    }

    const payload = {
      ...newProfile,
      dailyCalorieTarget: calorieTarget,
      dailyProteinTarget: proteinTarget,
      dailyCarbsTarget: carbsTarget,
      dailyFatsTarget: fatsTarget,
    };

    try {
      const token = await getIdToken();
      if (!token) return;

      const res = await fetch(`${NODE_BACKEND}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const updatedProfile = await res.json();
        setProfile(updatedProfile);
        showToast('Profile updated and nutritional targets recalculated!');
      } else {
        showToast("Failed to update profile in database", "error");
      }
    } catch (err) {
      console.error("Update profile error:", err);
      showToast("Network error updating profile", "error");
    }
  };

  // Calls the backend to analyze a meal. Throws a clear, user-facing error on
  // any failure. We intentionally do NOT fabricate mock nutrition data on
  // failure anymore — presenting made-up macros as a real result is misleading.
  const analyzeMealAPI = async (file, textInput, userPreferences) => {
    if (!file && !textInput) {
      throw new Error('Please provide a meal image or type ingredients first.');
    }

    const formData = new FormData();
    if (file) formData.append('photo', file);
    if (textInput) formData.append('text', textInput);
    formData.append('goal', userPreferences.goal || 'lose');
    formData.append('dietType', userPreferences.dietType || 'non-veg');
    formData.append('allergies', JSON.stringify(userPreferences.allergies || []));
    formData.append('restrictions', JSON.stringify(userPreferences.restrictions || []));
    formData.append('cuisinePreference', userPreferences.cuisinePreference || 'Any');
    formData.append('mealType', userPreferences.mealType || 'Lunch');

    let res;
    try {
      res = await fetch(`${PYTHON_BACKEND}/analyze`, { method: 'POST', body: formData });
    } catch (e) {
      console.error('Analysis service unreachable:', e);
      throw new Error("Couldn't reach the analysis service. Please check your connection and try again.");
    }

    if (res.ok) {
      const data = await res.json();
      showToast('Analysis complete!');
      return data;
    }

    // Non-2xx: log the raw backend message (often a long provider/quota dump)
    // but surface a short, clean message to the user.
    const errData = await res.json().catch(() => ({}));
    console.error('Analysis backend error:', errData.message || res.status);
    throw new Error("We couldn't analyze this meal right now — the AI service is temporarily unavailable. Please try again in a little while.");
  };

  // Orchestrates a scan: lives at the provider level (not in MealScanner) so
  // the request and its result outlive tab navigation. Call this instead of
  // analyzeMealAPI directly from the scanner UI.
  const runMealAnalysis = async (file, textInput, userPreferences) => {
    setScanState({ isLoading: true, result: null, error: null });
    try {
      const data = await analyzeMealAPI(file, textInput, userPreferences);
      setScanState({ isLoading: false, result: data, error: null });
      return data;
    } catch (err) {
      console.error('Meal analysis error:', err);
      const msg = err.message || 'Analysis failed. Please try again.';
      setScanState({ isLoading: false, result: null, error: msg });
      showToast(msg, 'error');
    }
  };

  const resetScanState = () => {
    setScanState({ isLoading: false, result: null, error: null });
  };

  return (
    <NutritionContext.Provider
      value={{
        profile,
        logs,
        toasts,
        showToast,
        removeToast,
        addLog,
        deleteLog,
        updateProfile,
        analyzeMealAPI,
        scanState,
        runMealAnalysis,
        resetScanState,
      }}
    >
      {children}
      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            onClick={() => removeToast(toast.id)}
            className={`pointer-events-auto p-4 rounded-xl shadow-xl flex items-center justify-between gap-3 text-white border text-sm font-medium transition-all duration-300 transform translate-y-0 animate-bounce-short cursor-pointer ${
              toast.type === 'success'
                ? 'bg-emerald-600 border-emerald-500'
                : toast.type === 'error'
                ? 'bg-rose-600 border-rose-500'
                : 'bg-slate-800 border-slate-700'
            }`}
          >
            <span>{toast.message}</span>
            <button className="text-white opacity-70 hover:opacity-100 transition-opacity font-bold">×</button>
          </div>
        ))}
      </div>
    </NutritionContext.Provider>
  );
};

export const useNutrition = () => {
  const context = useContext(NutritionContext);
  if (!context) throw new Error('useNutrition must be used within a NutritionProvider');
  return context;
};
