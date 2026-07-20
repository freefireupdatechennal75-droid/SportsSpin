import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Award, ShieldAlert, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react';
import CollegeHeader from './CollegeHeader';

interface AdminLoginProps {
  onLoginSuccess: (token: string, admin: { username: string; name: string }) => void;
  onNavigateToRegister: () => void;
}

export default function AdminLogin({ onLoginSuccess, onNavigateToRegister }: AdminLoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [forgotPasswordMsg, setForgotPasswordMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setForgotPasswordMsg('');

    if (!username.trim() || !password) {
      return setError('Please enter both your username and password.');
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      let data: any = {};
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(text || 'Non-JSON response received from server');
      }
      if (!res.ok) {
        throw new Error(data.error || 'Failed to authenticate');
      }

      onLoginSuccess(data.token, data.admin);
    } catch (err: any) {
      setError(err.message || 'Network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setForgotPasswordMsg('🔒 For security reasons, please contact the Central IT Helpdesk or Sports Committee General Secretary to reset your password.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 py-6 px-4 sm:px-6 lg:px-8 flex flex-col justify-between items-center relative overflow-hidden text-slate-100">
      
      {/* College Logo Banner */}
      <div className="max-w-5xl w-full mx-auto mb-2 no-print z-10">
        <CollegeHeader />
      </div>
      
      {/* Background Decorative Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-500/10 rounded-full filter blur-3xl"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-500/10 rounded-full filter blur-3xl"></div>

      {/* Top Header */}
      <div className="w-full max-w-md flex justify-between items-center z-10">
        <div className="flex items-center space-x-2">
          <Award className="w-8 h-8 text-indigo-400 animate-pulse" />
          <span className="font-extrabold tracking-tight text-lg italic text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 uppercase">Sports</span>
        </div>
        <button
          onClick={onNavigateToRegister}
          className="text-xs font-bold uppercase tracking-wider text-indigo-400 hover:text-indigo-300 transition-colors bg-white/5 border border-white/10 rounded-xl px-4 py-2 hover:bg-white/10"
        >
          Public Registration
        </button>
      </div>

      {/* Main Glass Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="glass-card rounded-3xl p-8 shadow-2xl relative overflow-hidden bg-white/5"
        >
          <div className="text-center mb-8">
            <div className="mx-auto w-12 h-12 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-4">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 italic">Admin Portal Login</h2>
            <p className="mt-2 text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
              Only authorized personnel are permitted to access this portal.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Username */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Username
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  name="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Angel"
                  required
                  className="block w-full pl-11 pr-4 py-3 rounded-xl border border-white/10 glass-input text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Password
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="block w-full pl-11 pr-11 py-3 rounded-xl border border-white/10 glass-input text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-indigo-500 border-white/10 bg-white/5 rounded-sm cursor-pointer accent-indigo-500"
                />
                <label htmlFor="remember-me" className="ml-2 block text-xs font-semibold text-slate-400 cursor-pointer select-none">
                  Remember me
                </label>
              </div>

              <div className="text-xs">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-500/10 text-red-300 border border-red-500/20 rounded-xl p-3.5 text-xs font-semibold flex items-start space-x-2"
              >
                <ShieldAlert className="w-5 h-5 flex-shrink-0 text-red-400" />
                <span>{error}</span>
              </motion.div>
            )}

            {forgotPasswordMsg && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-blue-500/10 text-blue-300 border border-blue-500/20 rounded-xl p-3.5 text-xs font-medium leading-relaxed"
              >
                {forgotPasswordMsg}
              </motion.div>
            )}

            {/* Login Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl shadow-2xl shadow-indigo-500/20 text-sm font-black uppercase tracking-widest text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Authorizing...
                  </span>
                ) : (
                  <span className="flex items-center space-x-2">
                    <span>Secure Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </button>
            </div>

<<<<<<< HEAD
           
=======
            {/* Default Seeded Credentials Notice */}
            <div className="pt-2 text-center">
              <span className="inline-block px-3 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 font-medium">
                🔑 Demo Credentials: <span className="font-bold text-white">Angel</span> / <span className="font-bold text-white">Angel123</span>
              </span>
            </div>
>>>>>>> e19f052aa2648a37e11b51455099e04d87634f32
          </form>
        </motion.div>
      </div>

      {/* Footer copyright */}
      <div className="text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest z-10 select-none">
        🔒 SECURED ADMINISTRATOR HUB &bull; SYSTEM VERSION 2.6
      </div>
    </div>
  );
}
