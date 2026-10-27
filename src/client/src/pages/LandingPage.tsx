import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Building2,
  FileText,
  Route,
  CheckCircle2,
  ArrowRight,
  Clock,
  Sparkles,
  KeyRound,
  ShieldCheck,
  AlertTriangle,
  Lightbulb,
  Droplets,
  Truck,
  HelpCircle,
  MapPin,
  Camera,
} from 'lucide-react';
import { DemoCredentialsModal } from '../components/common/DemoCredentialsModal';

export const LandingPage: React.FC = () => {
  const { user, enableDemoAccounts } = useAuth();
  const [demoModalOpen, setDemoModalOpen] = useState(false);

  return (
    <div className="space-y-16 sm:space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 sm:pt-16 pb-12 bg-gradient-to-b from-civic-50/70 via-slate-50 to-slate-50 border-b border-slate-200/70">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white text-civic-800 border border-civic-200 shadow-xs">
            <Building2 className="w-4 h-4 text-civic-600" aria-hidden="true" />
            <span>Civic Issue Resolution Platform • Open Demonstration</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
            <span className="block text-xs sm:text-sm font-bold text-civic-700 uppercase tracking-widest mb-3">
              Getitresolved Municipal Services
            </span>
            Report a local issue.
            <span className="block text-civic-600 mt-2">Track what happens next.</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            From damaged road surfaces and leaking water mains to faulty streetlights, clogged storm drains, and missed waste collection — submit neighborhood issues easily and track accountable municipal follow-up.
          </p>

          {/* Primary & Secondary Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            {user ? (
              <Link
                to={
                  user.role === 'ADMIN'
                    ? '/admin/dashboard'
                    : user.role === 'STAFF'
                    ? '/staff/queue'
                    : '/dashboard'
                }
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold text-white bg-civic-600 hover:bg-civic-700 rounded-xl shadow-sm hover:shadow transition-all min-h-[48px]"
              >
                <span>Go to Your Dashboard</span>
                <ArrowRight className="w-5 h-5" aria-hidden="true" />
              </Link>
            ) : (
              <>
                <Link
                  to="/submit"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold text-white bg-civic-600 hover:bg-civic-700 rounded-xl shadow-sm hover:shadow transition-all min-h-[48px]"
                >
                  <span>Report an Issue</span>
                  <ArrowRight className="w-5 h-5" aria-hidden="true" />
                </Link>

                <Link
                  to="/scoring-guide"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3.5 text-base font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-xs transition-all min-h-[48px]"
                >
                  <HelpCircle className="w-5 h-5 text-slate-400" aria-hidden="true" />
                  <span>How Scoring Works</span>
                </Link>

                {enableDemoAccounts && (
                  <button
                    type="button"
                    onClick={() => setDemoModalOpen(true)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors min-h-[48px]"
                    title="Test demo roles"
                  >
                    <KeyRound className="w-4 h-4 text-amber-700" aria-hidden="true" />
                    <span>Demo Accounts</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* Illustrative Journey Visual (Compact, responsive, clearly labeled as an example) */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-civic-800 bg-civic-50 px-2.5 py-0.5 rounded-full border border-civic-200">
                Illustrative Example
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-1">
                The Journey of a Civic Report
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              Ref: GR-2026-EXMPL (Sample Data)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
            {/* Step 1 in journey */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>1. Citizen Submission</span>
                <span className="w-2 h-2 rounded-full bg-amber-500" />
              </div>
              <div className="font-bold text-sm text-slate-900">Asphalt Pothole</div>
              <p className="text-xs text-slate-600 leading-normal">
                Citizen submits location and photos of hazardous road depression on Elm Street.
              </p>
              <div className="text-[11px] text-slate-400 font-medium">Status: SUBMITTED</div>
            </div>

            {/* Step 2 in journey */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>2. Department Assignment</span>
                <span className="w-2 h-2 rounded-full bg-blue-500" />
              </div>
              <div className="font-bold text-sm text-slate-900">Categorized & Assigned</div>
              <p className="text-xs text-slate-600 leading-normal">
                Issue categorized by topic and routed to the responsible Roads & Sidewalks maintenance crew.
              </p>
              <div className="text-[11px] text-slate-400 font-medium">Status: ASSIGNED</div>
            </div>

            {/* Step 3 in journey */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>3. Department Action</span>
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
              </div>
              <div className="font-bold text-sm text-slate-900">Work Underway</div>
              <p className="text-xs text-slate-600 leading-normal">
                Department staff acknowledges assignment, logs scheduling notes, and begins repair.
              </p>
              <div className="text-[11px] text-slate-400 font-medium">Status: IN_PROGRESS</div>
            </div>

            {/* Step 4 in journey */}
            <div className="bg-emerald-50/60 rounded-xl p-4 border border-emerald-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-800">
                <span>4. Verified Resolution</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="font-bold text-sm text-emerald-950">Fixed & Closed</div>
              <p className="text-xs text-emerald-800 leading-normal">
                Road patch completed. Citizen-visible resolution notes and timestamp recorded.
              </p>
              <div className="text-[11px] text-emerald-700 font-medium">Status: RESOLVED</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Simple Steps */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            How It Works in Three Simple Steps
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Clear, transparent handling designed to ensure issues reach the right municipal team without administrative delays.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-civic-50 text-civic-700 flex items-center justify-center border border-civic-100">
                <FileText className="w-6 h-6" aria-hidden="true" />
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-civic-700">Step 1</div>
              <h3 className="text-lg font-bold text-slate-900">Report the Issue</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Describe the problem, specify the location or ward, and optionally upload up to three photos. You receive an official tracking reference immediately.
              </p>
            </div>
            <div className="pt-2 text-xs text-slate-400 font-medium border-t border-slate-100">
              No account required to browse; sign in to submit and track.
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100">
                <Route className="w-6 h-6" aria-hidden="true" />
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-blue-700">Step 2</div>
              <h3 className="text-lg font-bold text-slate-900">Reach the Responsible Department</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Automated triage identifies the issue category, while defined municipal routing rules assign it directly to the responsible departmental queue. Submissions requiring human judgment route to administrative review.
              </p>
            </div>
            <div className="pt-2 text-xs text-slate-400 font-medium border-t border-slate-100">
              Separates objective triage from departmental assignment.
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
                <CheckCircle2 className="w-6 h-6" aria-hidden="true" />
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-700">Step 3</div>
              <h3 className="text-lg font-bold text-slate-900">Follow Transparent Updates</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Track status milestones on your dashboard as municipal staff review, update progress notes, and complete repairs. Every change includes timestamps and clear notes.
              </p>
            </div>
            <div className="pt-2 text-xs text-slate-400 font-medium border-t border-slate-100">
              Complete historical timeline visible to the citizen.
            </div>
          </div>
        </div>
      </section>

      {/* Supported Civic Categories */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Supported Municipal Services
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Getitresolved handles the core infrastructure categories that keep cities running safely and smoothly.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Building2 className="w-5 h-5" aria-hidden="true" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Roads & Sidewalks</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Potholes, pavement fractures, broken curbs, and roadway hazards.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100">
              <Lightbulb className="w-5 h-5" aria-hidden="true" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Electrical & Streetlights</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Dark pedestrian crossings, streetlight outages, and malfunctioning signals.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center border border-cyan-100">
              <Droplets className="w-5 h-5" aria-hidden="true" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Water Supply</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Water main leaks, low distribution pressure, and leaking municipal valves.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-100">
              <Route className="w-5 h-5" aria-hidden="true" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Drainage & Sewage</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Blocked storm drains, street flooding, catch basin clogs, and sewage backups.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
              <Truck className="w-5 h-5" aria-hidden="true" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Sanitation & Waste</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Missed pickup routes, illegal dumping, overflowing bins, and public debris.
            </p>
          </div>
        </div>
      </section>

      {/* Transparent Prioritization Overview */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-civic-700">
              <Sparkles className="w-4 h-4 text-civic-600" aria-hidden="true" />
              <span>Prioritization Standards</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Fair, Transparent Queue Prioritization
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              To ensure safety-critical hazards receive prompt attention without subjective bias, complaints are prioritized by safety hazard, neighborhood disruption, and the length of time awaiting resolution:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="font-bold text-slate-900">Priority (45%)</div>
              <p className="text-xs text-slate-600 leading-normal">
                Breadth of public disruption, transit impact, and utility service interruption.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="font-bold text-slate-900">Urgency (40%)</div>
              <p className="text-xs text-slate-600 leading-normal">
                Immediate bodily safety hazards, collision risks, and structural deterioration.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="font-bold text-slate-900">Duration (15%)</div>
              <p className="text-xs text-slate-600 leading-normal">
                Time elapsed without resolution (1 point per 3 days elapsed, up to 10 points).
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 leading-relaxed space-y-1">
            <div className="font-bold">Provisional Feasibility Assessment</div>
            <p>
              Feasibility is evaluated to assist department planning, but is <b>strictly excluded</b> from the core score formula so that difficult, complex municipal problems are never unfairly pushed down the queue.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-100 flex-wrap gap-3">
            <span className="text-xs text-slate-500">
              All scoring rules, formulas, and threshold stars are publicly documented.
            </span>
            <Link
              to="/scoring-guide"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-civic-700 hover:text-civic-900 hover:underline"
            >
              <span>Read Full Scoring Guide</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-civic-950 text-white rounded-3xl p-8 sm:p-12 shadow-md text-center space-y-6">
          <div className="space-y-2 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Ready to Report an Issue in Your Neighborhood?
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Help your municipality identify road hazards, utility faults, and sanitation concerns promptly.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to="/submit"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold text-slate-900 bg-white hover:bg-slate-100 rounded-xl shadow-sm transition-all min-h-[46px]"
            >
              <span>Submit a Report</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
            {!user && (
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 text-base font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-all min-h-[46px]"
              >
                <span>Create an Account</span>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Demo Credentials Modal */}
      <DemoCredentialsModal isOpen={demoModalOpen} onClose={() => setDemoModalOpen(false)} />
    </div>
  );
};
