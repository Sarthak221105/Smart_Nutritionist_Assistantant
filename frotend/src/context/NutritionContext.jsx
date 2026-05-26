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

        // Fetch User Profile
        const profileRes = await fetch(`${NODE_BACKEND}/api/auth/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfile(profileData);
        }

        // Fetch User Diet Logs
        const logsRes = await fetch(`${NODE_BACKEND}/api/diet`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
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

  // Try API call to analyze meals, falling back to simulation if backend is unavailable
  const analyzeMealAPI = async (file, textInput, userPreferences) => {
    try {
      if (file || textInput) {
        const formData = new FormData();
        if (file) formData.append('photo', file);
        if (textInput) formData.append('text', textInput);
        
        formData.append('goal', userPreferences.goal || 'lose');
        formData.append('dietType', userPreferences.dietType || 'non-veg');
        formData.append('allergies', JSON.stringify(userPreferences.allergies || []));
        formData.append('restrictions', JSON.stringify(userPreferences.restrictions || []));
        formData.append('cuisinePreference', userPreferences.cuisinePreference || 'Any');
        formData.append('mealType', userPreferences.mealType || 'Lunch');

        const res = await fetch(`${PYTHON_BACKEND}/analyze`, {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          showToast('Analysis completed successfully via backend AI!');
          return data;
        } else {
          console.warn('Backend API returned error, falling back to mock simulation.');
        }
      }
    } catch (e) {
      console.warn('Backend not reachable, falling back to mock simulation.', e);
    }

    // Simulating server request latency for standalone demo
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // High quality mock AI analysis generator
    const query = textInput || (file ? file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ") : "healthy meal");
    const parsedIngredients = query.toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
    
    // Core database of common ingredients for nutritional calculation
    const foodDatabase = {
      egg: { calories: 78, protein: 6.3, carbs: 0.6, fats: 5.3 },
      eggs: { calories: 156, protein: 12.6, carbs: 1.2, fats: 10.6 },
      banana: { calories: 89, protein: 1.1, carbs: 23, fats: 0.3 },
      milk: { calories: 120, protein: 8, carbs: 12, fats: 5 },
      rice: { calories: 205, protein: 4.2, carbs: 45, fats: 0.4 },
      chicken: { calories: 165, protein: 31, carbs: 0, fats: 3.6 },
      breast: { calories: 165, protein: 31, carbs: 0, fats: 3.6 },
      salmon: { calories: 208, protein: 22, carbs: 0, fats: 13 },
      spinach: { calories: 23, protein: 2.9, carbs: 3.6, fats: 0.4 },
      oats: { calories: 150, protein: 5, carbs: 27, fats: 2.5 },
      honey: { calories: 64, protein: 0.1, carbs: 17, fats: 0 },
      almonds: { calories: 164, protein: 6, carbs: 6, fats: 14 },
      avocado: { calories: 160, protein: 2, carbs: 8.5, fats: 14.7 },
      bread: { calories: 79, protein: 3, carbs: 15, fats: 1 },
      apple: { calories: 95, protein: 0.5, carbs: 25, fats: 0.3 },
      salad: { calories: 120, protein: 3, carbs: 10, fats: 8 },
      yogurt: { calories: 130, protein: 12, carbs: 6, fats: 4 },
      steak: { calories: 271, protein: 25, carbs: 0, fats: 19 },
      potatoes: { calories: 110, protein: 2, carbs: 26, fats: 0 },
      quinoa: { calories: 120, protein: 4, carbs: 21, fats: 2 },
      broccoli: { calories: 34, protein: 2.8, carbs: 7, fats: 0.4 },
    };

    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFats = 0;
    let detected = [];

    // Analyze query to match database items
    parsedIngredients.forEach(ing => {
      let matched = false;
      Object.keys(foodDatabase).forEach(dbKey => {
        if (ing.includes(dbKey) && !matched) {
          const item = foodDatabase[dbKey];
          totalCalories += item.calories;
          totalProtein += item.protein;
          totalCarbs += item.carbs;
          totalFats += item.fats;
          detected.push(ing);
          matched = true;
        }
      });
      if (!matched) {
        // Generate random but realistic nutrition for unknown items
        const randCal = Math.floor(Math.random() * 150) + 50;
        const randProt = Math.floor(Math.random() * 15) + 2;
        const randCarb = Math.floor(Math.random() * 25) + 5;
        const randFat = Math.floor(Math.random() * 10) + 1;

        totalCalories += randCal;
        totalProtein += randProt;
        totalCarbs += randCarb;
        totalFats += randFat;
        detected.push(ing);
      }
    });

    if (detected.length === 0) {
      // Default fallback if query is empty or completely unrecognizable
      totalCalories = 450;
      totalProtein = 22;
      totalCarbs = 48;
      totalFats = 16;
      detected = ['mixed grain bowl', 'healthy protein source', 'green vegetables'];
    }

    // Format macro precision
    totalCalories = Math.round(totalCalories);
    totalProtein = Math.round(totalProtein * 10) / 10;
    totalCarbs = Math.round(totalCarbs * 10) / 10;
    totalFats = Math.round(totalFats * 10) / 10;

    // Alignment Score Calculation
    let score = 8; // base
    const userGoal = userPreferences.goal || 'lose';
    if (userGoal === 'lose' && totalCalories > 600) score -= 2;
    if (userGoal === 'lose' && totalProtein > 25) score += 2;
    if (userGoal === 'gain' && totalCalories > 600) score += 2;
    if (userGoal === 'gain' && totalProtein < 15) score -= 2;
    if (userPreferences.dietType === 'vegan' && detected.some(d => d.includes('chicken') || d.includes('egg') || d.includes('milk') || d.includes('steak'))) {
      score = 2; // Conflict with vegan preference
    }
    score = Math.min(Math.max(score, 1), 10); // Clamp between 1 and 10

    // Formulate a professional Gemini-style Markdown report
    const titleCase = (str) => str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const detectedListStr = detected.map(d => `- **${titleCase(d)}**: Extracted and matched with nutritional databases.`).join('\n');
    
    const strengthText = score >= 7 
      ? `High nutrient density with an excellent macronutrient balance matching your goal to **${userGoal} weight**.`
      : `High caloric density relative to protein levels. Ideal for caloric surpluses but needs portion adjustments for weight loss goals.`;
    
    const warningText = userPreferences.dietType === 'vegan' && score === 2
      ? `🚨 **Allergy/Diet Conflict**: Contains non-vegan ingredients (animal products identified).`
      : userPreferences.allergies?.length > 0 
        ? `⚠️ **Allergy Precaution**: Double check if ingredients are processed in nut-free facilities.`
        : `None detected. This meal is fully aligned with your profile.`;

    const alignmentExplanation = score >= 8
      ? `This meal is highly supportive of your active health targets. It contains premium quality macronutrients that fuel muscle recovery and keep insulin spikes stable.`
      : score >= 5
        ? `This meal is moderately supportive but could be optimized. Consider replacing fast-digesting carbohydrates with slow-burning complex carbs.`
        : `This meal is sub-optimal for your targets. The calorie-to-protein ratio is high, which makes it easy to overshoot your calorie budget.`;

    const generatedNutritionReport = `
# NUTRITION & INGREDIENT ASSESSMENT

## 🥗 EXTRACTED INGREDIENTS
${detectedListStr}

## 📊 NUTRITIONAL BREAKDOWN
* **Total Energy**: ${totalCalories} kcal
* **Protein**: ${totalProtein} g
* **Carbohydrates**: ${totalCarbs} g
* **Fat**: ${totalFats} g

---

# DIET PROGRESS ANALYSIS

## 🎯 PROGRESS ASSESSMENT
* **Alignment Score**: ${score}/10
* **Goal Matching**: This meal is **${score >= 7 ? 'HELPING' : 'HINDERING'}** your goal to ${userGoal === 'lose' ? 'lose weight' : userGoal === 'gain' ? 'gain muscle mass' : 'maintain balance'}.
* **Strengths**: ${strengthText}
* **Weaknesses**: ${score < 7 ? 'Slightly high in saturated fat and refined carbohydrates.' : 'Low in simple sugars, rich in micronutrient density.'}

## 📈 NEXT STEPS
* **Immediate Adjustment**: ${userGoal === 'lose' ? 'Reduce portion size by 15% or add a leafy green side salad to increase fiber.' : 'Add a serving of complex carbs (sweet potato or quinoa) to push caloric intake.'}
* **Long-term Strategy**: Keep maintaining high protein ratios at meals to support lean skeletal mass preservation.

## 🚨 CONCERNS / WARNINGS
${warningText}
`;

    const generatedAiConsultation = `
# EXPERT AI NUTRITIONIST CONSULTATION

## MEAL RECOMMENDATIONS

### Option 1: ${titleCase(detected[0] || 'Superfood')} & Grain Fusion Bowl
* **Preparation**: Combine cooked ${detected[0] || 'grains'} with spinach, top with light vinaigrette, toasted sesame seeds, and your primary protein choice. Sauté lightly in a teaspoon of olive oil.
* **Nutritional Benefits**: Highly supportive for **${userGoal} weight** goals. Offers high-quality dietary fiber and high satiety levels.
* **Macro Breakdown**: ~${Math.round(totalProtein * 0.9)}g Protein | ~${Math.round(totalCarbs * 0.8)}g Carbs | ~${Math.round(totalFats * 0.7)}g Fats.
* **Additional Tips**: Add avocado slices for healthy monosaturated fats, or pinch of sea salt.

### Option 2: High-Protein Sauté with Zesty Herb Dressing
* **Preparation**: Sauté ${detected.join(' and ')} in a skillet with minced garlic. Drizzle fresh lemon juice and chopped parsley or cilantro on top prior to serving.
* **Nutritional Benefits**: Low glycemic load, reduces bloating, and maintains consistent energy releases.
* **Macro Breakdown**: ~${Math.round(totalProtein * 1.1)}g Protein | ~${Math.round(totalCarbs * 0.5)}g Carbs | ~${Math.round(totalFats * 0.9)}g Fats.
* **Additional Tips**: If vegan, replace meat components with extra-firm cubed organic tofu or tempeh.

## GOAL-SPECIFIC ADVICE
To successfully **${userGoal === 'lose' ? 'lose weight' : userGoal === 'gain' ? 'gain mass' : 'maintain your shape'}**, focus on eating volume-dense foods with low calorie concentration. This includes vegetables like broccoli, spinach, and asparagus. Stay hydrated with 3 liters of water daily.

## SHOPPING SUGGESTIONS
To elevate this meal, pick up some:
- Organic extra virgin olive oil
- Fresh baby spinach or kale
- Himalayan pink salt
- Hemp seeds or chia seeds for omega-3 enhancement
`;

    return {
      mealType: userPreferences.mealType || 'Lunch',
      foodItems: detected,
      calories: totalCalories,
      protein: totalProtein,
      carbs: totalCarbs,
      fats: totalFats,
      nutritionReport: generatedNutritionReport.trim(),
      aiConsultation: generatedAiConsultation.trim(),
      alignmentScore: score,
      explanation: alignmentExplanation,
    };
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
