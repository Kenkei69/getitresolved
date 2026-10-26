import React from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { HelpCircle, AlertTriangle, KeyRound, Camera, FileQuestion, ArrowRight, Mail, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

export const SupportPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <PageHeader
        title="Civic Help & Support Center"
        description="Assistance with reporting local issues, tracking complaint status, account credentials, and municipal service guidelines."
        badge="Citizen Assistance"
      />

      {/* Emergency Notice Alert */}
      <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3.5 text-sm text-amber-950 leading-relaxed shadow-xs">
        <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="space-y-1">
          <div className="font-bold text-base text-amber-900">Life-Threatening Emergency Notice</div>
          <p>
            Do not use this web application for immediate life-safety emergencies such as downed high-voltage power lines, gas leaks, water main collapses undermining buildings, or flash flood rescues. Contact local municipal emergency services (911 / emergency dispatcher) immediately.
          </p>
        </div>
      </div>

      {/* Section 1: Account Recovery & Password Help */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 text-slate-900 border-b border-slate-100 pb-3">
          <KeyRound className="w-5 h-5 text-civic-600" aria-hidden="true" />
          <h2 className="text-xl font-bold">Account Access & Password Recovery</h2>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed">
          If you have forgotten your password or are experiencing difficulties logging in, here is how account recovery works:
        </p>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-sm text-slate-700">
          <div className="font-semibold text-slate-900">Manual Administrator Credential Reset</div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Because this municipal deployment does not operate an automated third-party email gateway, password resets are processed securely by designated system administrators to protect citizen accounts from unauthorized takeover.
          </p>
          <div className="pt-2 text-xs text-slate-600">
            Please email your registered account address and full name to:
            <div className="font-mono font-semibold text-civic-800 text-sm mt-1">admin@civicresolve.gov</div>
          </div>
        </div>
      </section>

      {/* Section 2: Submitting a Complaint */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 text-slate-900 border-b border-slate-100 pb-3">
          <FileQuestion className="w-5 h-5 text-civic-600" aria-hidden="true" />
          <h2 className="text-xl font-bold">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-4 text-sm text-slate-700">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="font-bold text-slate-900">How do I track what happens to my complaint?</div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every submitted issue generates a unique reference number (e.g. <code>GR-2026-XXXXX</code>). When signed in as a citizen, visit your <Link to="/dashboard" className="text-civic-700 font-semibold hover:underline">Citizen Dashboard</Link> to view real-time department assignments, progress notes, and resolution records.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="font-bold text-slate-900">What are the photo attachment limits?</div>
            <p className="text-xs text-slate-600 leading-relaxed">
              You may attach up to three photos per complaint. Supported formats include JPG, PNG, and WEBP. Each file must be under 5 MB. Photos are kept private and accessible only to authorized personnel.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="font-bold text-slate-900">How does municipal prioritization work?</div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Issues receive objective priority scores based on public disruption (45%), immediate safety urgency (40%), and days elapsed without resolution (15%). Full mathematical details are published in our <Link to="/scoring-guide" className="text-civic-700 font-semibold hover:underline">Scoring Methodology Guide</Link>.
            </p>
          </div>
        </div>
      </section>

      {/* Section 3: Contact Channels */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 text-slate-900 border-b border-slate-100 pb-3">
          <Mail className="w-5 h-5 text-civic-600" aria-hidden="true" />
          <h2 className="text-xl font-bold">Direct Support Inquiries</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="font-bold text-slate-900">Technical Support & Operations</div>
            <div className="text-xs text-slate-600 font-mono">admin@civicresolve.gov</div>
            <p className="text-xs text-slate-500 pt-1">For platform issues, bug reports, and account recovery.</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="font-bold text-slate-900">Department Routing Guidance</div>
            <div className="text-xs text-slate-600">5 Municipal Operating Divisions</div>
            <p className="text-xs text-slate-500 pt-1">Roads, Streetlighting, Water Supply, Drainage, Sanitation.</p>
          </div>
        </div>

        <div className="pt-2 text-center">
          <Link
            to="/submit"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-civic-600 hover:bg-civic-700 rounded-xl transition-colors shadow-xs"
          >
            <span>Proceed to Report an Issue</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
};
