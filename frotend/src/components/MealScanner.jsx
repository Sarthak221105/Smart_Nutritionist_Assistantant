import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Sparkles,
  FileText,
  Lightbulb,
  Check,
  Plus,
  Compass,
  UtensilsCrossed,
  Salad,
} from 'lucide-react';
import { useNutrition } from '../context/NutritionContext';

const NUTRIENT_DISPLAY = [
  { key: 'fiber', label: 'Fiber', unit: 'g' },
  { key: 'iron', label: 'Iron', unit: 'mg' },
  { key: 'calcium', label: 'Calcium', unit: 'mg' },
  { key: 'vitaminD', label: 'Vitamin D', unit: 'mcg' },
  { key: 'vitaminC', label: 'Vitamin C', unit: 'mg' },
  { key: 'potassium', label: 'Potassium', unit: 'mg' },
];

const VERDICT_STYLE = {
  helping: { color: 'bg-emerald-500 shadow-emerald-500/20', bar: 'bg-emerald-500', label: 'Helping your goal' },
  neutral: { color: 'bg-amber-500 shadow-amber-500/20', bar: 'bg-amber-500', label: 'Neutral for your goal' },
  hindering: { color: 'bg-rose-500 shadow-rose-500/20', bar: 'bg-rose-500', label: 'Hindering your goal' },
};

const MealScanner = () => {
  const { scanState, runMealAnalysis, addLog, profile } = useNutrition();
  const { isLoading, result } = scanState;
  const [inputMode, setInputMode] = useState('upload'); // 'upload' or 'text'
  const [mealText, setMealText] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [activeResultTab, setActiveResultTab] = useState('report'); // 'report' or 'consultation'

  // Preference overrides for this scan
  const [scanPreferences, setScanPreferences] = useState({
    mealType: 'Lunch',
    goal: profile.goal,
    dietType: profile.dietType,
    allergies: [...profile.allergies],
    restrictions: [...profile.restrictions],
    cuisinePreference: profile.cuisinePreference,
  });

  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (inputMode === 'text' && !mealText.trim()) return;
    if (inputMode === 'upload' && !selectedFile) return;

    // Lives in NutritionContext, not local state — the request and its result
    // survive navigating to a different tab and back (see runMealAnalysis).
    await runMealAnalysis(selectedFile, inputMode === 'text' ? mealText : null, scanPreferences);
  };

  const handleAddToLog = () => {
    if (!result) return;
    addLog({
      mealType: scanPreferences.mealType,
      foodItems: result.foodItems,
      calories: result.nutrients.calories,
      protein: result.nutrients.protein,
      carbs: result.nutrients.carbs,
      fats: result.nutrients.fats,
      nutrients: result.nutrients,
    });
  };

  // Quick preset text inputs
  const fillPreset = (text) => {
    setInputMode('text');
    setMealText(text);
  };

  // Toggle list element
  const toggleArrayPreference = (field, value) => {
    setScanPreferences((prev) => {
      const list = prev[field];
      const newList = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
      return { ...prev, [field]: newList };
    });
  };

  // Simple Markdown line parser
  const renderMarkdown = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, index) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('# ')) {
        return (
          <h2 key={index} className="text-xl font-bold text-slate-800 dark:text-white mt-5 mb-2 pb-1 border-b border-slate-100 dark:border-slate-800">
            {trimmed.substring(2)}
          </h2>
        );
      }
      if (trimmed.startsWith('## ')) {
        return (
          <h3 key={index} className="text-lg font-bold text-slate-800 dark:text-white mt-4 mb-2 flex items-center gap-2">
            {trimmed.substring(3)}
          </h3>
        );
      }
      if (trimmed.startsWith('### ')) {
        return (
          <h4 key={index} className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-3 mb-1.5 uppercase tracking-wide">
            {trimmed.substring(4)}
          </h4>
        );
      }
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        // Bullet
        const boldMatch = trimmed.substring(2).match(/^\*\*(.*?)\*\*:(.*)/);
        if (boldMatch) {
          return (
            <p key={index} className="text-sm text-slate-650 dark:text-slate-350 ml-4 mb-1">
              <strong className="text-slate-800 dark:text-slate-200">{boldMatch[1]}:</strong>
              {boldMatch[2]}
            </p>
          );
        }
        return (
          <p key={index} className="text-sm text-slate-650 dark:text-slate-350 ml-4 mb-1 flex items-start gap-1.5">
            <span className="text-emerald-500 mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>{trimmed.substring(2)}</span>
          </p>
        );
      }
      if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
        return (
          <p key={index} className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-3 mb-2">
            {trimmed.replace(/\*\*/g, '')}
          </p>
        );
      }
      if (trimmed === '---') {
        return <hr key={index} className="my-4 border-slate-100 dark:border-slate-850" />;
      }
      if (trimmed === '') {
        return <div key={index} className="h-2" />;
      }
      return (
        <p key={index} className="text-sm text-slate-650 dark:text-slate-350 leading-relaxed mb-1.5">
          {trimmed}
        </p>
      );
    });
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
      {/* Left panel - Form & Preferences (5 cols) */}
      <div className="xl:col-span-5 space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="space-y-1">
            <h3 className="font-bold text-lg text-slate-850 dark:text-white flex items-center gap-2">
              <Sparkles className="text-brand-550 w-5 h-5" /> AI Nutrition Analyzer
            </h3>
            <p className="text-xs text-slate-400">Analyze food items instantly using Gemini AI models</p>
          </div>

          {/* Input Method Tabs */}
          <div className="bg-slate-100 dark:bg-slate-850 p-1 rounded-xl grid grid-cols-2 text-xs font-semibold">
            <button
              onClick={() => setInputMode('upload')}
              className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                inputMode === 'upload'
                  ? 'bg-white dark:bg-slate-800 text-brand-700 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
              id="tab-upload-mode"
            >
              <Upload className="w-3.5 h-3.5" /> Upload Image
            </button>
            <button
              onClick={() => setInputMode('text')}
              className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                inputMode === 'text'
                  ? 'bg-white dark:bg-slate-800 text-brand-700 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
              id="tab-text-mode"
            >
              <FileText className="w-3.5 h-3.5" /> Type Ingredients
            </button>
          </div>

          {/* Input Form Content */}
          <form onSubmit={handleAnalyze} className="space-y-5">
            {inputMode === 'upload' ? (
              <div className="space-y-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />

                {!previewUrl ? (
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={triggerFileInput}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-3 ${
                      dragActive
                        ? 'border-brand-500 bg-brand-50/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-brand-500 hover:bg-slate-50/40 dark:hover:bg-slate-850/40'
                    }`}
                    id="dropzone-area"
                  >
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-brand-600 dark:text-brand-400 rounded-xl">
                      <Upload className="w-6 h-6 animate-pulse-slow" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-350">
                        Drag & drop meal image, or <span className="text-brand-650">browse</span>
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">Supports JPG, JPEG, PNG formats</p>
                    </div>
                  </div>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 group">
                    <img src={previewUrl} alt="Meal preview" className="w-full h-48 object-cover opacity-90" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent flex items-end justify-between p-3">
                      <span className="text-xs font-semibold text-white truncate max-w-[70%]">{selectedFile.name}</span>
                      <button
                        type="button"
                        onClick={clearFile}
                        className="bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] px-2 py-1 transition-colors"
                        id="clear-photo-btn"
                      >
                        Change Image
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">List Ingredients</label>
                  <textarea
                    value={mealText}
                    onChange={(e) => setMealText(e.target.value)}
                    placeholder="e.g. 2 eggs, 1 slice sourdough bread, half avocado..."
                    rows="3"
                    className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-850 p-3 rounded-xl text-sm focus:outline-none focus:border-brand-500 text-slate-800 dark:text-white leading-relaxed resize-none"
                    id="meal-text-input"
                  />
                </div>

                {/* Preset suggestions */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Quick Presets</span>
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() => fillPreset('oats, banana, milk, honey, almonds')}
                      className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350 hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-brand-950/40 px-2 py-1 rounded-lg transition-colors font-medium"
                    >
                      🥞 Breakfast Oats
                    </button>
                    <button
                      type="button"
                      onClick={() => fillPreset('chicken breast, rice, broccoli, olive oil')}
                      className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350 hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-brand-950/40 px-2 py-1 rounded-lg transition-colors font-medium"
                    >
                      🍗 Gym Chicken & Rice
                    </button>
                    <button
                      type="button"
                      onClick={() => fillPreset('salmon, quinoa, asparagus, lemon')}
                      className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350 hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-brand-950/40 px-2 py-1 rounded-lg transition-colors font-medium"
                    >
                      🐟 Salmon & Quinoa
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Custom Scanning Preferences Dropdowns */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Preferences Customization</span>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-500 font-medium mb-1">Meal Target Goal</label>
                  <select
                    value={scanPreferences.goal}
                    onChange={(e) => setScanPreferences({ ...scanPreferences, goal: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-850 px-2 py-1.5 rounded-lg font-medium text-slate-800 dark:text-white"
                  >
                    <option value="lose">Lose Weight</option>
                    <option value="maintain">Maintain Weight</option>
                    <option value="gain">Gain Weight</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 font-medium mb-1">Diet Style</label>
                  <select
                    value={scanPreferences.dietType}
                    onChange={(e) => setScanPreferences({ ...scanPreferences, dietType: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-850 px-2 py-1.5 rounded-lg font-medium text-slate-800 dark:text-white"
                  >
                    <option value="non-veg">Non-Vegetarian</option>
                    <option value="vegetarian">Vegetarian</option>
                    <option value="vegan">Vegan</option>
                  </select>
                </div>
              </div>

              {/* Allergies and Restrictions */}
              <div className="space-y-2 text-xs">
                <div>
                  <span className="block text-slate-500 font-medium mb-1">Allergies (If any)</span>
                  <div className="flex flex-wrap gap-1">
                    {['Nuts', 'Dairy', 'Eggs', 'Seafood', 'Soy', 'Wheat'].map((allergy) => {
                      const lower = allergy.toLowerCase();
                      const active = scanPreferences.allergies.includes(lower);
                      return (
                        <button
                          key={allergy}
                          type="button"
                          onClick={() => toggleArrayPreference('allergies', lower)}
                          className={`px-2 py-1 rounded-lg border font-medium transition-all ${
                            active
                              ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/20 dark:border-rose-950/40 dark:text-rose-450'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-550'
                          }`}
                        >
                          {allergy}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <span className="block text-slate-500 font-medium mb-1">Dietary Restrictions</span>
                  <div className="flex flex-wrap gap-1">
                    {['Low-carb', 'High-protein', 'Gluten-free', 'Dairy-free', 'Low-fat', 'Keto'].map((restriction) => {
                      const lower = restriction.toLowerCase();
                      const active = scanPreferences.restrictions.includes(lower);
                      return (
                        <button
                          key={restriction}
                          type="button"
                          onClick={() => toggleArrayPreference('restrictions', lower)}
                          className={`px-2 py-1 rounded-lg border font-medium transition-all ${
                            active
                              ? 'bg-brand-50 border-brand-200 text-brand-700 dark:bg-brand-950/20 dark:border-brand-950/40 dark:text-brand-450'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-550'
                          }`}
                        >
                          {restriction}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || (inputMode === 'upload' && !selectedFile) || (inputMode === 'text' && !mealText.trim())}
              className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white py-3 rounded-2xl text-sm font-semibold shadow-lg shadow-emerald-500/10 transition-all flex items-center justify-center gap-2 transform active:scale-95"
              id="run-analysis-btn"
            >
              <Sparkles className="w-4 h-4" /> {isLoading ? 'Analyzing Meal...' : 'Get Nutrition Info'}
            </button>
          </form>
        </div>
      </div>

      {/* Right panel - AI Output & Report Display (7 cols) */}
      <div className="xl:col-span-7">
        <AnimatePresence mode="wait">
          {isLoading ? (
            /* Shimmering loading skeletons */
            <motion.div
              key="loading-skeleton"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-lg w-1/3 animate-pulse" />
                  <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-lg w-1/2 animate-pulse" />
                </div>
              </div>

              {/* Scanning visualizer */}
              <div className="relative border border-brand-100 dark:border-brand-950/40 rounded-2xl h-40 overflow-hidden bg-slate-50 dark:bg-slate-950/40 flex flex-col items-center justify-center">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-brand-500 to-transparent animate-bounce w-full shadow-lg shadow-emerald-500/50" />
                <UtensilsCrossed className="w-12 h-12 text-brand-500 opacity-40 animate-pulse-slow" />
                <p className="text-xs font-semibold text-brand-600 dark:text-brand-400 mt-3 tracking-widest uppercase">Scanning Food Elements</p>
                <p className="text-[10px] text-slate-400 mt-1">Calling Gemini AI Pro Vision & USDA databases...</p>
              </div>

              <div className="space-y-3">
                <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-lg w-1/4 animate-pulse" />
                <div className="h-3.5 bg-slate-100 dark:bg-slate-800 rounded-lg w-full animate-pulse" />
                <div className="h-3.5 bg-slate-100 dark:bg-slate-800 rounded-lg w-full animate-pulse" />
                <div className="h-3.5 bg-slate-100 dark:bg-slate-800 rounded-lg w-[85%] animate-pulse" />
              </div>

              <div className="grid grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-slate-50 dark:bg-slate-850 p-4 rounded-xl space-y-2">
                    <div className="h-3 bg-slate-150 dark:bg-slate-800 rounded-md w-1/2 mx-auto animate-pulse" />
                    <div className="h-5 bg-slate-150 dark:bg-slate-800 rounded-md w-2/3 mx-auto animate-pulse" />
                  </div>
                ))}
              </div>
            </motion.div>
          ) : result ? (
            /* Real AI Analysis results card */
            <motion.div
              key="analysis-result"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 100 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6"
            >
              {/* Macro breakdown top summary widget */}
              <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Analysis Complete</h4>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-slate-850 dark:text-white capitalize">
                      {result.foodItems[0] || 'Meal Report'} {result.foodItems.length > 1 && `+${result.foodItems.length - 1} items`}
                    </h3>
                    <span className="text-[10px] bg-brand-50 text-brand-700 dark:bg-brand-950/20 dark:text-brand-400 font-bold px-2 py-0.5 rounded-full">
                      Logged
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleAddToLog}
                  className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-500/10 transition-colors flex items-center gap-1.5"
                  id="add-to-log-btn"
                >
                  <Plus className="w-4 h-4" /> Add to Daily Log
                </button>
              </div>

              {/* Goal Alignment */}
              <div className="bg-slate-50 dark:bg-slate-850/50 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-4 justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-extrabold text-lg shadow-md ${
                    (VERDICT_STYLE[result.goalAlignment.verdict] || VERDICT_STYLE.neutral).color
                  }`}>
                    {result.goalAlignment.score}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800 dark:text-white">
                      {(VERDICT_STYLE[result.goalAlignment.verdict] || VERDICT_STYLE.neutral).label}
                    </h4>
                    <p className="text-xs text-slate-400 max-w-sm md:max-w-xs">{result.goalAlignment.summary}</p>
                  </div>
                </div>
                <div className="w-full md:w-44 flex flex-col gap-1.5">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                    <span>Weak</span>
                    <span>Excellent</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-850 h-2 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${result.goalAlignment.score * 10}%` }}
                      transition={{ duration: 1 }}
                      className={`h-full rounded-full ${(VERDICT_STYLE[result.goalAlignment.verdict] || VERDICT_STYLE.neutral).bar}`}
                    />
                  </div>
                </div>
              </div>

              {/* Macro breakdown */}
              <div className="grid grid-cols-4 gap-2">
                <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-xl text-center">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">Energy</p>
                  <p className="text-lg font-bold text-slate-800 dark:text-white font-mono mt-1">{result.nutrients.calories} <span className="text-[10px] text-slate-400 font-normal">kcal</span></p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-xl text-center border-b-2 border-emerald-500">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">Protein</p>
                  <p className="text-lg font-bold text-slate-800 dark:text-white font-mono mt-1">{result.nutrients.protein}g</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-xl text-center border-b-2 border-amber-500">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">Carbs</p>
                  <p className="text-lg font-bold text-slate-800 dark:text-white font-mono mt-1">{result.nutrients.carbs}g</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-xl text-center border-b-2 border-rose-500">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">Fat</p>
                  <p className="text-lg font-bold text-slate-800 dark:text-white font-mono mt-1">{result.nutrients.fats}g</p>
                </div>
              </div>

              {/* Micronutrient breakdown */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {NUTRIENT_DISPLAY.map(({ key, label, unit }) => (
                  <div key={key} className="bg-slate-50 dark:bg-slate-850 p-2.5 rounded-xl text-center">
                    <p className="text-[9px] font-semibold text-slate-400 uppercase">{label}</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-white font-mono mt-0.5">
                      {result.nutrients[key] ?? 0}<span className="text-[9px] text-slate-400 font-normal">{unit}</span>
                    </p>
                  </div>
                ))}
              </div>

              {/* Extracted food items */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Salad className="w-3.5 h-3.5" /> Extracted Food Items
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {result.foodItems.map((item, idx) => (
                    <span key={idx} className="text-xs font-medium capitalize bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg">
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              {/* Short, concrete suggestion */}
              <div className="bg-brand-50/60 dark:bg-brand-950/20 border border-brand-100 dark:border-brand-900/30 rounded-2xl p-4 flex gap-3 items-start">
                <Lightbulb className="w-5 h-5 text-brand-600 dark:text-brand-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-white mb-0.5">Suggestion</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed">{result.suggestion}</p>
                </div>
              </div>

              {/* AI Recommendations (separate, deliberately detailed recipe suggestions) */}
              <div className="space-y-3">
                <button
                  onClick={() => setActiveResultTab(activeResultTab === 'consultation' ? 'report' : 'consultation')}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm font-semibold text-slate-700 dark:text-slate-300"
                  id="tab-ai-recommendations"
                >
                  <span className="flex items-center gap-1.5"><Compass className="w-4 h-4" /> AI Recipe Recommendations</span>
                  <span className="text-xs text-slate-400">{activeResultTab === 'consultation' ? 'Hide' : 'Show'}</span>
                </button>
                {activeResultTab === 'consultation' && (
                  <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
                    {renderMarkdown(result.aiConsultation)}
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            /* Initial blank state panel */
            <motion.div
              key="blank-scanner"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center flex flex-col items-center justify-center min-h-[500px] shadow-sm space-y-4"
            >
              <div className="p-4 bg-slate-50 dark:bg-slate-850 text-slate-350 dark:text-slate-600 rounded-2xl">
                <UtensilsCrossed className="w-12 h-12" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-850 dark:text-white text-base">Awaiting Nutrition Analysis</h4>
                <p className="text-slate-400 text-xs max-w-sm mx-auto">
                  Provide ingredients via file uploading or type list entries in the left dashboard. Our AI will compute full caloric and macro assessments instantly.
                </p>
              </div>
              <div className="flex flex-col gap-2 w-full max-w-[280px] pt-2">
                <div className="flex items-center gap-2.5 text-left border border-slate-100 dark:border-slate-800 p-2.5 rounded-xl text-xs text-slate-400 bg-slate-50/50 dark:bg-slate-850/50">
                  <Check className="w-4 h-4 text-emerald-500" /> Image recognition via Gemini Vision
                </div>
                <div className="flex items-center gap-2.5 text-left border border-slate-100 dark:border-slate-800 p-2.5 rounded-xl text-xs text-slate-400 bg-slate-50/50 dark:bg-slate-850/50">
                  <Check className="w-4 h-4 text-emerald-500" /> Precise macro count via USDA DB
                </div>
                <div className="flex items-center gap-2.5 text-left border border-slate-100 dark:border-slate-800 p-2.5 rounded-xl text-xs text-slate-400 bg-slate-50/50 dark:bg-slate-850/50">
                  <Check className="w-4 h-4 text-emerald-500" /> Meal-matching recipes recommendation
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MealScanner;
