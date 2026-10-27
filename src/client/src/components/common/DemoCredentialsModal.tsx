import React, { useState } from 'react';
import { Modal } from './Modal';
import { Alert } from './Alert';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Shield, HardHat, User, Check, ArrowRight, AlertTriangle } from 'lucide-react';

interface DemoCredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFill?: (email: string, pass: string) => void;
}

export const DemoCredentialsModal: React.FC<DemoCredentialsModalProps> = ({
  isOpen,
  onClose,
  onSelectFill,
}) => {
  const { login, enableDemoAccounts, isProduction } = useAuth();
  const navigate = useNavigate();
  const [loadingEmail, setLoadingEmail] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'citizen' | 'staff_admin'>('citizen');

  if (!enableDemoAccounts) return null;

  const citizenAccounts = [
    {
      role: 'CITIZEN',
      badge: 'Citizen Account',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      icon: User,
      name: 'Jane Doe',
      email: 'citizen.jane@example.com',
      password: 'Citizen123!',
      desc: 'Submit complaints with photos, track status history, and review updates across personal submissions.',
      targetPath: '/dashboard',
    },
    {
      role: 'CITIZEN',
      badge: 'Citizen Account',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      icon: User,
      name: 'John Smith',
      email: 'citizen.john@example.com',
      password: 'Citizen123!',
      desc: 'Submit new issues, verify municipal location handling, and track resolution notifications.',
      targetPath: '/dashboard',
    },
  ];

  const privilegedAccounts = [
    {
      role: 'ADMIN',
      badge: 'System Administrator',
      badgeClass: 'bg-red-50 text-red-800 border-red-200',
      icon: Shield,
      name: 'Elena Rostova',
      email: 'admin@civicresolve.gov',
      password: 'Admin123!',
      desc: 'System-wide complaint routing, manual review queue, score overrides with justification, and audit history inspection.',
      targetPath: '/admin/dashboard',
    },
    {
      role: 'STAFF',
      badge: 'Water Department Staff',
      badgeClass: 'bg-cyan-50 text-cyan-800 border-cyan-200',
      icon: HardHat,
      name: 'David Okafor',
      email: 'staff.water@civicresolve.gov',
      password: 'Staff123!',
      desc: 'Water supply department queue (pipe leaks, pressure anomalies), status transitions, and resolution notes.',
      targetPath: '/staff/queue',
    },
    {
      role: 'STAFF',
      badge: 'Electrical Staff',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
      icon: HardHat,
      name: 'Sophia Chen',
      email: 'staff.electrical@civicresolve.gov',
      password: 'Staff123!',
      desc: 'Streetlight outages and damaged wiring queue with status updates.',
      targetPath: '/staff/queue',
    },
  ];

  const displayedAccounts =
    isProduction || activeTab === 'citizen' ? citizenAccounts : privilegedAccounts;

  const handleQuickLogin = async (acc: typeof citizenAccounts[0]) => {
    setLoginError(null);

    if (onSelectFill) {
      onSelectFill(acc.email, acc.password);
      onClose();
      return;
    }

    try {
      setLoadingEmail(acc.email);
      await login({ email: acc.email, password: acc.password });
      onClose();
      navigate(acc.targetPath);
    } catch (err: any) {
      console.error('Demo login failed:', err);
      setLoginError(
        err.message || 'Authentication request failed. Please check network connectivity or backend readiness.'
      );
    } finally {
      setLoadingEmail(null);
    }
  };

  const handleCopy = (email: string, pass: string) => {
    navigator.clipboard.writeText(`${email}\n${pass}`);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setLoginError(null);
        onClose();
      }}
      title="Test Demonstration Accounts"
      description="Select an account to review role-based civic workflows. In production, privileged staff and administrator credentials require authorized internal provisioning."
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {loginError && (
          <Alert variant="error" title="Sign In Unsuccessful" onDismiss={() => setLoginError(null)}>
            {loginError}
          </Alert>
        )}

        {/* Tab switch only visible in development/preview environments */}
        {!isProduction && (
          <div className="flex border-b border-slate-200 gap-4 text-sm font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('citizen')}
              className={`pb-2 border-b-2 transition-colors ${
                activeTab === 'citizen'
                  ? 'border-civic-600 text-civic-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Citizen Accounts
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('staff_admin')}
              className={`pb-2 border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'staff_admin'
                  ? 'border-civic-600 text-civic-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-amber-600" />
              <span>Staff & Admin (Dev Only)</span>
            </button>
          </div>
        )}

        {isProduction && (
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5 text-xs text-slate-600">
            <Shield className="w-4 h-4 text-civic-600 shrink-0 mt-0.5" />
            <span>
              <b>Production Demo Policy:</b> Staff and Administrator accounts are restricted to authorized municipal personnel. Use the citizen test accounts below to preview issue submission and tracking.
            </span>
          </div>
        )}

        <div className="space-y-3">
          {displayedAccounts.map((acc) => {
            const Icon = acc.icon;
            const isLoggingIn = loadingEmail === acc.email;

            return (
              <div
                key={acc.email}
                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-civic-300 hover:shadow-xs transition-all space-y-2.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${acc.badgeClass}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {acc.badge}
                    </span>
                    <span className="text-sm font-bold text-slate-900">{acc.name}</span>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => handleCopy(acc.email, acc.password)}
                      className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1 min-h-[32px]"
                      title="Copy credentials"
                    >
                      {copiedEmail === acc.email ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Copied</span>
                        </>
                      ) : (
                        'Copy'
                      )}
                    </button>
                    <button
                      type="button"
                      disabled={isLoggingIn}
                      onClick={() => handleQuickLogin(acc)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-civic-600 hover:bg-civic-700 rounded-lg transition-colors shadow-xs disabled:opacity-50 min-h-[32px]"
                    >
                      {isLoggingIn ? 'Signing in...' : onSelectFill ? 'Fill Credentials' : 'Sign In as Test User'}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="text-xs text-slate-500 font-mono">
                  {acc.email} &bull; <span className="text-slate-400">{acc.password}</span>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{acc.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
};
