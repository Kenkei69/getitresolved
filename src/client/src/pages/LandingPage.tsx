import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Building2,
  Cpu,
  Route,
  Star,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  FileCheck2,
  Clock,
  Sparkles,
  KeyRound,
} from 'lucide-react';
import { DemoCredentialsModal } from '../components/common/DemoCredentialsModal';

export const LandingPage: React.FC = () => {
  const { user, enableDemoAccounts } = useAuth();
  const [demoModalOpen, setDemoModalOpen] = useState(false);

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 bg-gradient-to-b from-civic-50/60 to-transparent border-b border-slate-200/60">
        <div className="max-w-5xl mx-auto px-4 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-civic-100 text-civic-900 border border-civic-200 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-civic-600" />
            Next-Gen Municipal Resolution Infrastructure
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
            Getitresolved
            <span className="block text-civic-600 font-bold text-3xl sm:text-4xl mt-2">
              AI-Powered Citizen Complaint Management
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Submit local issues in seconds. Automated AI classification, deterministic department routing, and multi-factor impact scoring ensure transparent, accountable municipal action.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {user ? (
              <Link
                to={
                  user.role === 'ADMIN'
                    ? '/admin/dashboard'
                    : user.role === 'STAFF'
                    ? '/staff/queue'
                    : '/dashboard'
                }
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-civic-600 hover:bg-civic-700 rounded-xl shadow-md transition-all"
              >
                Go to Your Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/submit"
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-civic-600 hover:bg-civic-700 rounded-xl shadow-md transition-all"
                >
                  Report a Civic Issue
                  <ArrowRight className="w-4 h-4" />
                </Link>
                {enableDemoAccounts && (
                  <button
                    type="button"
                    onClick={() => setDemoModalOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-sm transition-all"
                  >
                    <KeyRound className="w-4 h-4 text-amber-600" />
                    Try Demo Accounts
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* 4 Pillars of Getitresolved */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            How Getitresolved Operates
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Engineered for high municipal accountability with zero automated guesswork.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-civic-300 transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">1. AI Categorization</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Analyzes citizen reports into standard categories with confidence scoring. If confidence falls below 75%, it automatically diverts to administrative manual triage.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-civic-300 transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <Route className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">2. Deterministic Routing</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Maps category and service area to the responsible department using configurable municipal rules. Separates AI classification from official department assignment.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-civic-300 transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100">
              <Star className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">3. 4-Factor Core Scoring</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Computes Priority (45%), Urgency (40%), and Duration (15%). Feasibility is provisional and excluded from core score so difficult problems are not deprioritized.
            </p>
          </div>

          {/* Card 4 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-civic-300 transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">4. Audit & Overrides</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every status change, department reassignment, and score override is permanently tracked with actor timestamp and mandatory justification reasons.
            </p>
          </div>
        </div>
      </section>

      {/* Threshold Stars Overview */}
      <section className="max-w-4xl mx-auto px-4 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
          Strict Impact Threshold Indicators (&gt; 7.0)
        </h3>
        <p className="text-xs text-slate-600 mb-4">
          Stars highlight severe conditions strictly greater than 7.0 (7.0 exact gives no star). These are objective assessment indicators, not citizen ratings:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg border border-red-200 bg-red-50/50 flex items-start gap-2.5">
            <span className="text-priorityRed text-base font-bold shrink-0">★</span>
            <div>
              <span className="font-bold text-red-900">Red Star — Priority &gt; 7.0</span>
              <p className="text-red-700 mt-0.5">High public disruption, health hazard, or essential service outage.</p>
            </div>
          </div>

          <div className="p-3 rounded-lg border border-pink-200 bg-pink-50/50 flex items-start gap-2.5">
            <span className="text-durationPink text-base font-bold shrink-0">★</span>
            <div>
              <span className="font-bold text-pink-900">Pink Star — Duration &gt; 7.0</span>
              <p className="text-pink-700 mt-0.5">Unresolved for over 21 days (calculated: floor(days / 3)).</p>
            </div>
          </div>

          <div className="p-3 rounded-lg border border-orange-200 bg-orange-50/50 flex items-start gap-2.5">
            <span className="text-urgencyOrange text-base font-bold shrink-0">★</span>
            <div>
              <span className="font-bold text-orange-900">Orange Star — Urgency &gt; 7.0</span>
              <p className="text-orange-700 mt-0.5">Immediate safety risk, rapid deterioration, or pitch-dark street.</p>
            </div>
          </div>

          <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/50 flex items-start gap-2.5">
            <span className="text-feasibilityGreen text-base font-bold shrink-0">★</span>
            <div>
              <span className="font-bold text-emerald-900">Green Star — Feasibility &gt; 7.0</span>
              <p className="text-emerald-700 mt-0.5">Provisional assessment indicates relatively straightforward resolution.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Credentials Modal */}
      <DemoCredentialsModal isOpen={demoModalOpen} onClose={() => setDemoModalOpen(false)} />
    </div>
  );
};
