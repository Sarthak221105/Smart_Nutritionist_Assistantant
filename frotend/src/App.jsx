import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Sparkles,
  History as HistoryIcon,
  Settings as SettingsIcon,
  LineChart,
  Menu,
  X,
  Sun,
  Moon,
  Scale,
  LogOut,
} from 'lucide-react';
import { NutritionProvider, useNutrition } from './context/NutritionContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import MealScanner from './components/MealScanner';
import History from './components/History';
import Settings from './components/Settings';
import NutrientTrends from './components/NutrientTrends';

const AppShell = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('nutri_dark') === 'true';
  });

  const { profile } = useNutrition();
  const { logout } = useAuth();

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    localStorage.setItem('nutri_dark', darkMode);
  }, [darkMode]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, component: Dashboard },
    { id: 'scanner', label: 'AI Meal Scanner', icon: Sparkles, component: MealScanner },
    { id: 'trends', label: 'Nutrient Trends', icon: LineChart, component: NutrientTrends },
    { id: 'history', label: 'Log History', icon: HistoryIcon, component: History },
    { id: 'settings', label: 'Profile Metrics', icon: SettingsIcon, component: Settings },
  ];

  const ActiveComponent = navItems.find((item) => item.id === activeTab)?.component || Dashboard;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-200">
      
      {/* Sidebar Navigation */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-6 flex-shrink-0 relative">
        {/* Brand logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 font-bold">
            🥗
          </div>
          <div>
            <h1 className="text-base font-extrabold text-slate-850 dark:text-white leading-tight font-sans tracking-tight">Smart Nutri</h1>
            <p className="text-[10px] text-brand-600 dark:text-brand-400 font-semibold uppercase tracking-wider">AI Assistant</p>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-brand-50 dark:bg-brand-950/20 text-brand-700 dark:text-brand-400 border border-brand-100/50 dark:border-brand-900/10'
                    : 'text-slate-550 hover:text-slate-700 dark:hover:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850/50'
                }`}
                id={`sidebar-nav-${item.id}`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-450'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Quick user status card in sidebar */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 truncate">
              <div className="w-8 h-8 rounded-full bg-emerald-550/10 dark:bg-emerald-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                {profile.name ? profile.name.charAt(0) : 'U'}
              </div>
              <div className="truncate max-w-[100px]">
                <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{profile.name || 'User'}</p>
                <p className="text-[10px] text-slate-400 capitalize">{profile.goal || 'lose'} weight</p>
              </div>
            </div>
            
            <button
              onClick={logout}
              className="p-1.5 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-all cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-50 dark:bg-slate-850 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/30">
            <div className="space-y-0.5">
              <span className="text-slate-400 font-semibold uppercase block">Weight</span>
              <span className="font-extrabold text-slate-700 dark:text-slate-300 font-mono flex items-center gap-0.5"><Scale className="w-2.5 h-2.5" /> {profile.weight || 0} kg</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-slate-400 font-semibold uppercase block">Height</span>
              <span className="font-extrabold text-slate-700 dark:text-slate-300 font-mono flex items-center gap-0.5"><Sun className="w-2.5 h-2.5 text-amber-500" /> {profile.height || 0} cm</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Top Navigation Header */}
      <header className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between z-40 sticky top-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-md shadow-emerald-500/20">
            🥗
          </div>
          <span className="text-sm font-bold text-slate-850 dark:text-white leading-tight">Smart Nutri</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl transition-colors"
            id="mobile-theme-btn"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-450" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl transition-colors"
            id="mobile-menu-btn"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Drawer Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-40 md:hidden flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white dark:bg-slate-900 w-64 max-w-sm h-full flex flex-col justify-between border-l border-slate-200 dark:border-slate-800 p-6 relative z-10"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-850">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-md">🥗</span>
                    <span className="text-sm font-extrabold text-slate-850 dark:text-white">Smart Nutri</span>
                  </div>
                  <button onClick={() => setIsMobileMenuOpen(false)} className="p-1 rounded-lg text-slate-450 hover:bg-slate-50 dark:hover:bg-slate-800">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <nav className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold transition-all ${
                          isActive
                            ? 'bg-brand-50 dark:bg-brand-950/20 text-brand-700 dark:text-brand-400'
                            : 'text-slate-550 hover:text-slate-700 dark:hover:text-slate-350'
                        }`}
                        id={`mobile-nav-${item.id}`}
                      >
                        <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-450'}`} />
                        {item.label}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Mobile Drawer Footer User status */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-brand-50 dark:bg-brand-950/30 text-brand-650 dark:text-brand-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    {profile.name ? profile.name.charAt(0) : 'U'}
                  </div>
                  <div className="truncate max-w-[120px]">
                    <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{profile.name || 'User'}</p>
                    <p className="text-[10px] text-slate-400 capitalize">{profile.goal || 'lose'} weight</p>
                  </div>
                </div>
                
                <button
                  onClick={logout}
                  className="p-2 text-rose-500 hover:text-rose-600 rounded-xl transition-all cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main app panel */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Desktop Topbar Header */}
        <header className="hidden md:flex bg-white dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-850 px-8 py-5 items-center justify-between sticky top-0 z-30 backdrop-blur-md">
          <div className="space-y-0.5">
            <h2 className="text-xl font-bold text-slate-850 dark:text-white capitalize leading-tight">
              {navItems.find((item) => item.id === activeTab)?.label}
            </h2>
            <p className="text-[10px] text-slate-400">Smart Nutritionist Assistant Dashboard</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Dark mode toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-450 dark:text-slate-350 transition-colors"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              id="desktop-theme-btn"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-450" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Quick avatar summary */}
            <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-800 pl-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 text-white font-extrabold flex items-center justify-center text-sm shadow-md shadow-emerald-500/10">
                {profile.name ? profile.name.charAt(0) : 'U'}
              </div>
              <span className="text-xs font-semibold text-slate-650 dark:text-slate-300">{profile.name || 'User'}</span>
            </div>
          </div>
        </header>

        {/* Scrollable View Area */}
        <div className="flex-1 p-6 md:p-8 max-h-[calc(100vh-80px)] md:max-h-[calc(100vh-82px)] overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              <ActiveComponent setActiveTab={setActiveTab} />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

    </div>
  );
};

const AppContent = () => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return currentUser ? <AppShell /> : <Auth />;
};

function App() {
  return (
    <AuthProvider>
      <NutritionProvider>
        <AppContent />
      </NutritionProvider>
    </AuthProvider>
  );
}

export default App;
