import React, { useState } from 'react';
import { Modal } from './Modal';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Shield, HardHat, User, Check, ArrowRight } from 'lucide-react';

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
  const { login, enableDemoAccounts } = useAuth();
  const navigate = useNavigate();
  const [loadingEmail, setLoadingEmail] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  if (!enableDemoAccounts) return null;

  const demoAccounts = [
    {
      role: 'ADMIN',
      badge: 'System Administrator',
      badgeClass: 'bg-red-100 text-red-800 border-red-200',
      icon: Shield,
      name: 'Elena Rostova',
      email: 'admin@civicresolve.gov',
      password: 'Admin123!',
      desc: 'Full access to all complaints, manual review queue, score overrides, and department staff assignments.',
      targetPath: '/admin/dashboard',
    },
    {
      role: 'STAFF',
      badge: 'Electrical Staff',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
      icon: HardHat,
      name: 'Sophia Chen',
      email: 'staff.electrical@civicresolve.gov',
      password: 'Staff123!',
      desc: 'Electrical department queue (streetlights, damaged wiring), status updating, and flagging for review.',
      targetPath: '/staff/queue',
    },
    {
      role: 'STAFF',
      badge: 'Roads Staff',
      badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: HardHat,
      name: 'Marcus Vance',
      email: 'staff.roads@civicresolve.gov',
      password: 'Staff123!',
      desc: 'Roads & Public Works queue (potholes, asphalt damage, sidewalk ramps).',
      targetPath: '/staff/queue',
    },
    {
      role: 'STAFF',
      badge: 'Water Staff',
      badgeClass: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      icon: HardHat,
      name: 'David Okafor',
      email: 'staff.water@civicresolve.gov',
      password: 'Staff123!',
      desc: 'Water supply queue (pipe bursts, pressure anomalies, water quality).',
      targetPath: '/staff/queue',
    },
    {
      role: 'CITIZEN',
      badge: 'Citizen Account',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      icon: User,
      name: 'Jane Doe',
      email: 'citizen.jane@example.com',
      password: 'Citizen123!',
      desc: 'Submit complaints with photos, track status history, and view assigned departments.',
      targetPath: '/dashboard',
    },
    {
      role: 'CITIZEN',
      badge: 'Citizen Account',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      icon: User,
      name: 'John Smith',
      email: 'citizen.john@example.com',
      password: 'Citizen123!',
      desc: 'Submit complaints, track personal complaints, view resolution progress.',
      targetPath: '/dashboard',
    },
  ];

  const handleQuickLogin = async (acc: typeof demoAccounts[0]) => {
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
    } catch (err) {
      console.error('Failed demo login:', err);
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
      onClose={onClose}
      title="Demonstration Accounts"
      description="Select an account to instantly sign in or test role-based access control."
      maxWidth="xl"
    >
      <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
        {demoAccounts.map((acc) => {
          const Icon = acc.icon;
          const isLoggingIn = loadingEmail === acc.email;

          return (
            <div
              key={acc.email}
              className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-civic-300 hover:shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${acc.badgeClass}`}>
                    <Icon className="w-3 h-3" />
                    {acc.badge}
                  </span>
                  <span className="text-sm font-bold text-slate-900">{acc.name}</span>
                </div>
                <div className="text-xs text-slate-500 font-mono">
                  {acc.email} &bull; <span className="text-slate-400">{acc.password}</span>
                </div>
                <p className="text-xs text-slate-600 line-clamp-1">{acc.desc}</p>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <button
                  type="button"
                  onClick={() => handleCopy(acc.email, acc.password)}
                  className="px-2 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  title="Copy email & password to clipboard"
                >
                  {copiedEmail === acc.email ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : 'Copy'}
                </button>
                <button
                  type="button"
                  disabled={isLoggingIn}
                  onClick={() => handleQuickLogin(acc)}
                  className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-civic-600 hover:bg-civic-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                >
                  {isLoggingIn ? 'Signing in...' : onSelectFill ? 'Fill Form' : '1-Click Login'}
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </Modal>
  );
};
