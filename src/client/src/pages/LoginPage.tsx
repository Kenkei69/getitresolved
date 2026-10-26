import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building2, AlertCircle, KeyRound, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { DemoCredentialsModal } from '../components/common/DemoCredentialsModal';
import { FormLabel, FormHelp, FormError, Input } from '../components/common/FormField';
import { Button } from '../components/common/Button';

export const LoginPage: React.FC = () => {
  const { login, enableDemoAccounts } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoModalOpen, setDemoModalOpen] = useState(false);

  const getSafeRedirect = (defaultPath: string) => {
    const statePath = (location.state as any)?.from?.pathname || (location.state as any)?.returnTo;
    if (typeof statePath === 'string' && statePath.startsWith('/') && !statePath.startsWith('//')) {
      return statePath;
    }
    return defaultPath;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please enter both your email address and password.');
      return;
    }

    try {
      setLoading(true);
      const user = await login({ email: email.trim(), password });
      if (user.role === 'ADMIN') {
        navigate(getSafeRedirect('/admin/dashboard'));
      } else if (user.role === 'STAFF') {
        navigate(getSafeRedirect('/staff/queue'));
      } else {
        navigate(getSafeRedirect('/dashboard'));
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify your credentials and try again.');
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
    <div className="min-h-[75vh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-civic-700 text-white flex items-center justify-center mx-auto shadow-sm">
          <Building2 className="w-6 h-6" aria-hidden="true" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Sign In to Getitresolved
        </h1>
        <p className="text-sm text-slate-500">
          Access your citizen reports, municipal queues, or administrative review
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-8 shadow-sm border border-slate-200 rounded-3xl space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800 flex items-start gap-2.5" role="alert">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <FormLabel htmlFor="email" required>
                Email Address
              </FormLabel>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="citizen.jane@example.com"
                disabled={loading}
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <FormLabel htmlFor="password" required>
                  Password
                </FormLabel>
                <Link
                  to="/support"
                  className="text-xs font-medium text-civic-700 hover:text-civic-900 hover:underline"
                >
                  Need login help?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-civic-500 rounded-lg"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full mt-2"
              icon={<ArrowRight className="w-4 h-4" />}
              iconPosition="right"
            >
              Sign In
            </Button>
          </form>

          {/* Quick Demo Switcher helper for development/testing */}
          {enableDemoAccounts && (
            <div className="pt-2 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={() => setDemoModalOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-200 transition-colors"
              >
                <KeyRound className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Fill with a Demo Account</span>
              </button>
            </div>
          )}

          <div className="text-center text-sm text-slate-500 pt-3 border-t border-slate-100">
            Do not have an account yet?{' '}
            <Link to="/register" className="font-semibold text-civic-700 hover:text-civic-900 hover:underline">
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
