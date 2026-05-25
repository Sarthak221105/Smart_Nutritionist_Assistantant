import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Sparkles, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email.trim(), password.trim());
      } else {
        if (!name.trim()) throw new Error('Please enter your name');
        await register(email.trim(), password.trim(), name.trim());
      }
    } catch (err) {
      console.error(err);
      let errMsg = err.message;
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        errMsg = 'Invalid email or password';
      } else if (err.code === 'auth/email-already-in-use') {
        errMsg = 'An account with this email already exists';
      } else if (err.code === 'auth/weak-password') {
        errMsg = 'Password should be at least 6 characters';
      } else if (err.code === 'auth/invalid-email') {
        errMsg = 'Please enter a valid email address';
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 relative overflow-hidden transition-colors duration-200">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-500/10 dark:bg-emerald-550/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-amber-500/10 dark:bg-amber-550/5 blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/40 p-8 shadow-xl shadow-slate-100/40 dark:shadow-none relative z-10"
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-brand-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-emerald-500/25 mb-4">
            🥗
          </div>
          <h2 className="text-2xl font-extrabold text-slate-850 dark:text-white tracking-tight">
            {isLogin ? 'Welcome Back' : 'Get Started'}
          </h2>
          <p className="text-sm text-slate-400 mt-1.5 text-center">
            {isLogin 
              ? 'Analyze your meals & optimize your nutrition' 
              : 'Create a profile to begin tracking calories and recipes'}
          </p>
        </div>

        {/* Error Message */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 flex items-start gap-2.5 p-4 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-2xl border border-rose-100 dark:border-rose-900/10 text-sm font-medium"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="popLayout">
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-1.5"
              >
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Alex Carter"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-slate-800 dark:text-slate-100"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand-600 hover:bg-brand-500 disabled:bg-brand-650 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all mt-6 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>{isLogin ? 'Sign In' : 'Sign Up'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Toggle Link */}
        <div className="text-center mt-6">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-all"
          >
            {isLogin ? (
              <>Don't have an account? <span className="text-brand-600 dark:text-brand-400 font-bold">Sign Up</span></>
            ) : (
              <>Already have an account? <span className="text-brand-600 dark:text-brand-400 font-bold">Sign In</span></>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
