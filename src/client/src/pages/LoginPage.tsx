import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building2, AlertCircle, KeyRound, ArrowRight } from 'lucide-react';
import { DemoCredentialsModal } from '../components/common/DemoCredentialsModal';

export const LoginPage: React.FC = () => {
  const { login, enableDemoAccounts } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoModalOpen, setDemoModalOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);
      const user = await login({ email, password });
      if (user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (user.role === 'STAFF') {
        navigate('/staff/queue');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleFill = (fillEmail: string, fillPass: string) => {
    setEmail(fillEmail);
    setPassword(fillPass);
    setError(null);
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-civic-600 text-white flex items-center justify-center mx-auto shadow-md shadow-civic-100">
          <Building2 className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Sign In to Getitresolved
        </h2>
        <p className="text-xs text-slate-500">
          Access your citizen reports, municipal queues, or administrative oversight
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-2xl space-y-6">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g., citizen.jane@example.com"
                className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:border-civic-500 focus:ring-1 focus:ring-civic-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter account password"
                className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:border-civic-500 focus:ring-1 focus:ring-civic-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-civic-600 hover:bg-civic-700 rounded-lg shadow-sm disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick Demo Credentials Panel (hidden in production when demo accounts disabled) */}
          {enableDemoAccounts && (
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  1-Click Demo Fill:
                </span>
                <button
                  type="button"
                  onClick={() => setDemoModalOpen(true)}
                  className="text-[11px] font-semibold text-civic-600 hover:underline flex items-center gap-1"
                >
                  <KeyRound className="w-3 h-3" />
                  View all accounts
                </button>
              </div>

              <div className="grid grid-cols-3 gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => handleFill('citizen.jane@example.com', 'Citizen123!')}
                  className="py-1 px-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-medium truncate text-center"
                >
                  Citizen Jane
                </button>
                <button
                  type="button"
                  onClick={() => handleFill('staff.electrical@civicresolve.gov', 'Staff123!')}
                  className="py-1 px-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-medium truncate text-center"
                >
                  Electrical Staff
                </button>
                <button
                  type="button"
                  onClick={() => handleFill('admin@civicresolve.gov', 'Admin123!')}
                  className="py-1 px-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-medium truncate text-center"
                >
                  Admin
                </button>
              </div>
            </div>
          )}

          <div className="text-center text-xs text-slate-500">
            Don't have an account yet?{' '}
            <Link to="/register" className="font-semibold text-civic-600 hover:underline">
              Register as Citizen
            </Link>
          </div>
        </div>
      </div>

      <DemoCredentialsModal
        isOpen={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
        onSelectFill={handleFill}
      />
    </div>
  );
};
