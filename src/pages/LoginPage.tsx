import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Store, Lock, User, AlertCircle, ArrowRight, ShieldCheck, ShoppingCart } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState<string>('admin');
  const [password, setPassword] = useState<string>('admin123');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(username.trim(), password.trim());
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check username and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (userChoice: 'admin' | 'staff') => {
    setError(null);
    setLoading(true);
    const u = userChoice === 'admin' ? 'admin' : 'staff';
    const p = userChoice === 'admin' ? 'admin123' : 'staff123';
    setUsername(u);
    setPassword(p);
    try {
      await login(u, p);
    } catch (err: any) {
      setError(err.message || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-blue-600/30 font-bold">
          <Store className="w-8 h-8" />
        </div>
        <h2 className="mt-4 text-2xl font-extrabold text-slate-900 tracking-tight">
          AI Smart Billing & Sales System
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Small Business Point-of-Sale, Inventory & Invoicing Management
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl sm:px-10 border border-slate-200">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-medium flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Username</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  placeholder="admin or staff"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-lg shadow-md transition cursor-pointer flex items-center justify-center space-x-1.5"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Store'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-2 text-center">
              Quick Role Sign-In (College Project Evaluation)
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="p-2.5 bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-lg text-left transition cursor-pointer"
              >
                <div className="font-bold text-slate-800 text-[11px] flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>Admin Login</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  admin / admin123
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('staff')}
                className="p-2.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg text-left transition cursor-pointer"
              >
                <div className="font-bold text-slate-800 text-[11px] flex items-center space-x-1">
                  <ShoppingCart className="w-3.5 h-3.5 text-blue-600" />
                  <span>Staff Login</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  staff / staff123
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center mt-6 text-xs text-slate-400">
          AI Smart Billing and Sales System • SQLite Local Storage • Python 3.15 Ready
        </div>
      </div>
    </div>
  );
};
