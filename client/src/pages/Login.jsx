import React, { useState } from 'react';
import useAuthStore from '../store/authStore';
import { Sparkles, Eye, EyeOff, Lock, Mail } from 'lucide-react';

export const Login = ({ onNavigate }) => {
  const { login, error, loading, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    const success = await login(email, password);
    if (success) {
      onNavigate('dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 font-sans">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden p-8">
        
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-600 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            GenForge AI
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">GenForge</h1>
          <p className="text-sm text-slate-500 mt-1">Forge a resume that fits the role.</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-medium flex justify-between items-center">
            <span>{error}</span>
            <button onClick={clearError} className="text-[10px] uppercase font-bold text-rose-500 hover:text-rose-700">Dismiss</button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl pl-10 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-slate-900 text-white font-medium text-xs rounded-xl hover:bg-slate-800 transition disabled:opacity-50 mt-2"
          >
            {loading ? 'Logging in...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center mt-6 text-xs text-slate-500">
          <span>Don't have an account? </span>
          <button
            onClick={() => {
              clearError();
              onNavigate('register');
            }}
            className="font-semibold text-indigo-600 hover:underline"
          >
            Sign Up
          </button>
        </div>

        <div className="mt-8 border-t border-slate-100 pt-6 text-center">
          <p className="text-[10px] text-slate-400">
            For quick demo access, use: <strong className="text-slate-600">demo@genforge.com</strong> / <strong className="text-slate-600">password123</strong>
          </p>
        </div>
      </div>
    </div>
  );
};
