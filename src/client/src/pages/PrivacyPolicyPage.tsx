import React from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { Shield, Eye, Lock, Server, FileText, Mail, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <PageHeader
        title="Privacy & Data Governance Notice"
        description="Transparent information on how personal data, complaint descriptions, and photo attachments are handled within the Getitresolved civic management service."
        badge="Citizen Data Protection"
      />

      {/* Scope Disclaimer */}
      <div className="p-4 rounded-2xl bg-civic-50/70 border border-civic-200 flex items-start gap-3 text-sm text-civic-900 leading-relaxed">
        <Info className="w-5 h-5 text-civic-700 shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <span className="font-bold">Demonstration Civic Platform Notice: </span>
          Getitresolved is an open municipal issue management system. This policy honestly describes the real technical safeguards, access boundaries, and retention practices implemented in this codebase.
        </div>
      </div>

      {/* Section 1: Information Collected */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 text-slate-900 border-b border-slate-100 pb-3">
          <FileText className="w-5 h-5 text-civic-600" aria-hidden="true" />
          <h2 className="text-xl font-bold">1. Information We Collect</h2>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed">
          When using Getitresolved to report municipal problems or track resolution, the system collects only the information necessary to identify the issue and route it to maintenance personnel:
        </p>

        <ul className="space-y-2 text-sm text-slate-700 list-disc list-inside">
          <li>
            <b>Account Credentials:</b> Name and email address provided during citizen registration or authentication, used solely for session management and issue tracking.
          </li>
          <li>
            <b>Complaint Details:</b> Issue title, descriptive summary, neighborhood or service ward, and physical street address or intersection.
          </li>
          <li>
            <b>Photo Attachments:</b> Up to three voluntary image files (JPG, PNG, WEBP) documenting the physical municipal condition.
          </li>
          <li>
            <b>Technical Log Data:</b> Request correlation IDs and network IP addresses recorded transiently in sliding rate-limiting buckets and server access logs strictly for abuse prevention and service stability.
          </li>
        </ul>
      </section>

      {/* Section 2: Photo Storage & Private Access */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 text-slate-900 border-b border-slate-100 pb-3">
          <Lock className="w-5 h-5 text-civic-600" aria-hidden="true" />
          <h2 className="text-xl font-bold">2. Private Storage & Attachment Security</h2>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed">
          Complaint photos frequently show private property boundaries or recognizable surroundings. We treat all uploaded attachments with strict access isolation:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="font-bold text-sm text-slate-900">Authenticated Access Only</div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Photos are stored in private object storage and streamed only through authorized application endpoints. Raw unauthenticated URLs are never issued.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="font-bold text-sm text-slate-900">Role-Enforced Boundaries</div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Only the submitting citizen, assigned municipal department staff, and authorized system administrators can view attachment images.
            </p>
          </div>
        </div>
      </section>

      {/* Section 3: AI Processing & Deterministic Routing */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 text-slate-900 border-b border-slate-100 pb-3">
          <Server className="w-5 h-5 text-civic-600" aria-hidden="true" />
          <h2 className="text-xl font-bold">3. Issue Categorization & Automated Processing</h2>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed">
          To accelerate routing to the right department, complaint text is processed by a categorization assistant with a deterministic rule-based fallback:
        </p>

        <ul className="space-y-2 text-sm text-slate-700 list-disc list-inside">
          <li>
            Processing evaluates complaint text solely to determine municipal category (Roads, Streetlighting, Water, Drainage, or Sanitation) and estimate initial urgency.
          </li>
          <li>
            Complaint text is never sold, licensed, or used for commercial behavioral profiling.
          </li>
          <li>
            When automated confidence is low or ambiguous, complaints are forwarded directly to human administrators in the Manual Review queue without guessing a department.
          </li>
        </ul>
      </section>

      {/* Section 4: Audit Accountability & Data Retention */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 text-slate-900 border-b border-slate-100 pb-3">
          <Eye className="w-5 h-5 text-civic-600" aria-hidden="true" />
          <h2 className="text-xl font-bold">4. Audit Trails & Retention</h2>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed">
          Municipal governance requires accountability. Whenever an issue changes status, a department is assigned, or an administrator overrides an automated score, a permanent record is created in the audit event log with the timestamp, actor identity, and mandatory justification note.
        </p>

        <p className="text-sm text-slate-600 leading-relaxed">
          Records are preserved for administrative service reviews and historical accountability. If you need a demonstration record or account removed, submit an administrative request to the contact below.
        </p>
      </section>

      {/* Section 5: Inquiries & Support */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 text-slate-900 border-b border-slate-100 pb-3">
          <Mail className="w-5 h-5 text-civic-600" aria-hidden="true" />
          <h2 className="text-xl font-bold">5. Contact & Privacy Inquiries</h2>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed">
          For privacy inquiries, account data deletion, or operational questions, contact the system administration team:
        </p>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 space-y-1">
          <div><b>System Administration:</b> admin@civicresolve.gov</div>
          <div><b>Support Portal:</b> <Link to="/support" className="text-civic-700 font-semibold hover:underline">Civic Help & Support Center</Link></div>
          <div className="text-xs text-slate-500 pt-1">Requests are typically acknowledged by administrative staff within 2 business days.</div>
        </div>
      </section>
    </div>
  );
};
