import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ComplaintItem } from '../../../shared/types';
import { StatusBadge } from '../components/common/StatusBadge';
import { ScoreCard } from '../components/common/ScoreCard';
import { StatusUpdateModal } from '../components/complaint/StatusUpdateModal';
import { FlagReviewModal } from '../components/complaint/FlagReviewModal';
import { ManualReviewModal } from '../components/complaint/ManualReviewModal';
import { ScoreOverrideModal } from '../components/complaint/ScoreOverrideModal';
import { Alert } from '../components/common/Alert';
import { Button } from '../components/common/Button';
import {
  Building2,
  Calendar,
  Clock,
  MapPin,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sliders,
  Flag,
  ShieldCheck,
  RotateCw,
  Eye,
  ImageOff,
  Sparkles,
  ExternalLink,
  Printer,
  Copy,
  Check,
} from 'lucide-react';

export const ComplaintDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [complaint, setComplaint] = useState<ComplaintItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals state
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [flagModalOpen, setFlagModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [retryingAnalysis, setRetryingAnalysis] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);

  const handleCopyRef = () => {
    if (complaint) {
      navigator.clipboard.writeText(complaint.reference);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    }
  };

  // Image load error tracker
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const fetchComplaint = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await api.getComplaint(id);
      setComplaint(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load complaint details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaint();
  }, [id]);

  const handleStatusUpdate = async (toStatus: any, note: string, isCitizenVisible: boolean, explanation?: string) => {
    if (!complaint) return;
    try {
      await api.updateStatus(complaint.id, { toStatus, note, isCitizenVisible, explanation });
      setActionNotice({ type: 'success', message: 'Status updated successfully.' });
      setTimeout(() => setActionNotice(null), 4000);
      await fetchComplaint();
    } catch (err: any) {
      setActionNotice({ type: 'error', message: err.message || 'Failed to update status.' });
    }
  };

  const handleFlagReview = async (reason: string) => {
    if (!complaint) return;
    try {
      await api.flagForReview(complaint.id, reason);
      setActionNotice({ type: 'success', message: 'Complaint flagged for administrator review.' });
      setTimeout(() => setActionNotice(null), 4000);
      await fetchComplaint();
    } catch (err: any) {
      setActionNotice({ type: 'error', message: err.message || 'Failed to flag complaint.' });
    }
  };

  const handleManualReviewDecision = async (categoryId: string, departmentId: string, notes: string) => {
    if (!complaint) return;
    try {
      await api.submitManualReviewDecision(complaint.id, {
        categoryId,
        departmentId,
        reviewDecision: 'APPROVED',
        notes,
      });
      setActionNotice({ type: 'success', message: 'Manual review completed and department assigned.' });
      setTimeout(() => setActionNotice(null), 4000);
      await fetchComplaint();
    } catch (err: any) {
      setActionNotice({ type: 'error', message: err.message || 'Failed to submit review decision.' });
    }
  };

  const handleScoreOverride = async (scores: any) => {
    if (!complaint) return;
    try {
      await api.overrideScores(complaint.id, scores);
      setActionNotice({ type: 'success', message: 'Impact scores updated with audit log justification.' });
      setTimeout(() => setActionNotice(null), 4000);
      await fetchComplaint();
    } catch (err: any) {
      setActionNotice({ type: 'error', message: err.message || 'Failed to override scores.' });
    }
  };

  const handleRetryAnalysis = async () => {
    if (!complaint) return;
    try {
      setRetryingAnalysis(true);
      await api.retryAnalysis(complaint.id);
      setActionNotice({ type: 'success', message: 'Triage re-analysis completed.' });
      setTimeout(() => setActionNotice(null), 4000);
      await fetchComplaint();
    } catch (err: any) {
      setActionNotice({ type: 'error', message: `Retry failed: ${err.message}` });
    } finally {
      setRetryingAnalysis(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-civic-600 border-t-transparent animate-spin mx-auto" />
        <p className="text-sm text-slate-500">Loading complaint details...</p>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" aria-hidden="true" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Unable to Load Complaint</h2>
        <p className="text-sm text-slate-600">{error || 'Complaint not found.'}</p>
        <Button variant="outline" onClick={() => navigate(-1)} icon={<ArrowLeft className="w-4 h-4" />}>
          Back to list
        </Button>
      </div>
    );
  }

  const isCitizen = user?.role === 'CITIZEN';
  const isStaff = user?.role === 'STAFF';
  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Breadcrumb & Action Banner */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-4 print:hidden">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Back to List</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyRef}
            className="inline-flex items-center gap-1.5 font-mono text-sm font-bold text-civic-700 bg-civic-50 hover:bg-civic-100 px-3 py-1.5 rounded-xl border border-civic-200 transition-colors shadow-xs"
            title="Click to copy tracking reference"
          >
            {copiedRef ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{complaint.reference}</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-xl shadow-xs transition-colors"
            title="Print or export PDF receipt"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>

      {/* Printable Receipt Municipal Header (Visible exclusively when printing or generating PDF) */}
      <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black uppercase tracking-wider text-slate-900">
              Getitresolved &bull; Municipal Issue Management
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Official Resolution Tracking Receipt &bull; Municipal Public Works &amp; Infrastructure
            </p>
          </div>
          <div className="text-right text-xs text-slate-600">
            <div>Printed: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</div>
            <div className="font-mono font-bold text-sm text-slate-900 mt-0.5">{complaint.reference}</div>
          </div>
        </div>
      </div>

      {actionNotice && (
        <Alert
          variant={actionNotice.type === 'success' ? 'success' : 'error'}
          onDismiss={() => setActionNotice(null)}
        >
          {actionNotice.message}
        </Alert>
      )}

      {/* Primary Details Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <StatusBadge status={complaint.status} reviewState={complaint.reviewState} />
            {complaint.department && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                <Building2 className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                {complaint.department.name}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {complaint.title}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4 text-slate-400" aria-hidden="true" />
              {complaint.address} &bull; {complaint.serviceArea.name}
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4 text-slate-400" aria-hidden="true" />
              Submitted {new Date(complaint.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Operational Actions for Staff / Admin */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start md:self-center print:hidden">
          {isStaff && complaint.status !== 'RESOLVED' && (
            <Button
              variant="primary"
              size="md"
              onClick={() => setStatusModalOpen(true)}
            >
              Update Status
            </Button>
          )}

          {isStaff && complaint.reviewState !== 'REQUIRED' && (
            <Button
              variant="outline"
              size="md"
              onClick={() => setFlagModalOpen(true)}
              icon={<Flag className="w-4 h-4 text-amber-600" />}
            >
              Flag Assignment
            </Button>
          )}

          {isAdmin && (
            <>
              {complaint.reviewState === 'REQUIRED' && (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setReviewModalOpen(true)}
                  className="bg-purple-600 hover:bg-purple-700"
                  icon={<ShieldCheck className="w-4 h-4" />}
                >
                  Manual Triage
                </Button>
              )}

              <Button
                variant="outline"
                size="md"
                onClick={() => setStatusModalOpen(true)}
              >
                Change Status
              </Button>

              <Button
                variant="outline"
                size="md"
                onClick={() => setOverrideModalOpen(true)}
                icon={<Sliders className="w-4 h-4 text-slate-500" />}
              >
                Override Scores
              </Button>
            </>
          )}

          {(isStaff || isAdmin) && complaint.analysisState === 'FAILED' && (
            <Button
              variant="secondary"
              size="md"
              onClick={handleRetryAnalysis}
              loading={retryingAnalysis}
              icon={<RotateCw className="w-4 h-4" />}
            >
              Retry Analysis
            </Button>
          )}
        </div>
      </div>

      {/* Main Grid: Description & Timeline (Left 2 cols) + Scoring & Routing (Right 1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Resolution Banner (if resolved) */}
          {complaint.status === 'RESOLVED' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 space-y-2">
              <div className="flex items-center gap-2 text-emerald-950 font-bold text-base">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" aria-hidden="true" />
                <span>Issue Resolved and Closed</span>
              </div>
              <p className="text-sm text-emerald-900 leading-relaxed font-medium">
                {complaint.resolutionNote || 'The responsible municipal department has inspected, addressed, and closed this issue.'}
              </p>
              {complaint.resolvedAt && (
                <div className="text-xs text-emerald-700 pt-1 font-medium">
                  Official closure date: {new Date(complaint.resolvedAt).toLocaleString()}
                </div>
              )}
            </div>
          )}

          {/* Description Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
              Citizen Report Details
            </h2>

            <p className="text-base text-slate-800 leading-relaxed whitespace-pre-line">
              {complaint.description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100 text-sm text-slate-600">
              <div className="space-y-1">
                <span className="font-semibold text-slate-800 block text-xs uppercase tracking-wider">
                  Location & Area
                </span>
                <div className="text-slate-900 font-medium">{complaint.address}</div>
                <div className="text-xs text-slate-500">
                  Ward: {complaint.serviceArea.name} ({complaint.serviceArea.description})
                </div>
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-slate-800 block text-xs uppercase tracking-wider">
                  Submission Details
                </span>
                <div className="text-slate-900 font-medium">
                  {new Date(complaint.createdAt).toLocaleString()}
                </div>
                {complaint.firstNoticedDate && (
                  <div className="text-xs text-slate-500">
                    Condition first observed: {new Date(complaint.firstNoticedDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Photo Attachments with Error Handling */}
          {complaint.attachments && complaint.attachments.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                  Photo Evidence ({complaint.attachments.length})
                </h2>
                <span className="text-xs text-slate-400">Private, authorized storage</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {complaint.attachments.map((att) => (
                  <div
                    key={att.id}
                    className="relative rounded-2xl overflow-hidden border border-slate-200 aspect-video bg-slate-100 group shadow-2xs"
                  >
                    {failedImages[att.id] ? (
                      <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-slate-400 bg-slate-50">
                        <ImageOff className="w-6 h-6 mb-1 text-slate-300" aria-hidden="true" />
                        <span className="text-xs font-medium">Preview unavailable</span>
                      </div>
                    ) : (
                      <>
                        <img
                          src={att.url}
                          alt={att.originalFilename}
                          onError={() => setFailedImages((prev) => ({ ...prev, [att.id]: true }))}
                          className="w-full h-full object-cover"
                        />
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 transition-all flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-civic-500"
                          aria-label={`View photo ${att.originalFilename}`}
                        >
                          <span className="opacity-0 group-hover:opacity-100 text-white text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-900/80 flex items-center gap-1.5 transition-opacity">
                            <Eye className="w-4 h-4" />
                            <span>View Full Image</span>
                          </span>
                        </a>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status & Progress Updates Timeline */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
              {isCitizen ? 'Progress Updates & Timeline' : 'Official Status Updates'}
            </h2>

            {complaint.statusHistory && complaint.statusHistory.length > 0 ? (
              <div className="relative border-l-2 border-slate-200 ml-3 space-y-6 pl-6 py-2">
                {complaint.statusHistory.map((item) => (
                  <div key={item.id} className="relative">
                    {/* Timeline bullet */}
                    <div className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-civic-600 ring-4 ring-white" />
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">
                          {item.toStatus.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(item.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {item.note && (
                        <p className="text-sm text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-100 leading-relaxed">
                          {item.note}
                        </p>
                      )}
                      {!isCitizen && item.changedByName && (
                        <div className="text-xs text-slate-400">
                          Recorded by: <span className="font-medium text-slate-600">{item.changedByName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">No progress updates recorded yet.</p>
            )}
          </div>

          {/* Internal Audit Events (Restricted strictly to Staff & Administrators) */}
          {!isCitizen && complaint.auditEvents && complaint.auditEvents.length > 0 && (
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Internal Administrative Audit Trail
              </h2>
              <div className="divide-y divide-slate-200 text-xs">
                {complaint.auditEvents.map((ae) => (
                  <div key={ae.id} className="py-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">{ae.action}</span>
                      <span className="text-slate-400 font-mono">
                        {new Date(ae.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-slate-600">
                      Actor: <span className="font-semibold text-slate-800">{ae.actorName}</span>
                    </div>
                    {ae.details && (
                      <pre className="text-xs bg-white p-2.5 rounded-xl border border-slate-200 overflow-x-auto text-slate-700 font-mono">
                        {JSON.stringify(ae.details, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (1 Col): Routing & Score Card */}
        <div className="space-y-6">
          {/* Department Assignment Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              Department Routing
            </span>

            {complaint.department ? (
              <div className="space-y-1.5">
                <div className="font-bold text-lg text-slate-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-civic-600" aria-hidden="true" />
                  <span>{complaint.department.name}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {complaint.department.description}
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-900 space-y-1">
                <div className="font-bold text-sm flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-purple-600" aria-hidden="true" />
                  <span>Manual Review Required</span>
                </div>
                <p className="text-purple-800 leading-relaxed">
                  This report is in the administrative review queue awaiting verified departmental routing.
                </p>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1.5">
              <div>
                <span className="font-semibold text-slate-700">Category:</span>{' '}
                {complaint.category?.name || 'Unassigned / Triage'}
              </div>
              <div>
                <span className="font-semibold text-slate-700">Service Ward:</span>{' '}
                {complaint.serviceArea.name}
              </div>
            </div>
          </div>

          {/* Core Impact Score Breakdown */}
          <ScoreCard scores={complaint.scores} showBreakdown={true} />

          {/* AI / Rule-based Triage Analysis Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-3.5 text-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              Automated Triage Analysis
            </span>

            <div className="space-y-2 text-slate-700">
              <div className="flex items-center justify-between">
                <span>Classification Engine:</span>
                <span className="font-semibold capitalize px-2 py-0.5 rounded-md bg-slate-100 text-slate-800">
                  {complaint.analysisProvider?.replace(/_/g, ' ') || 'Pending'}
                </span>
              </div>

              {complaint.classificationConfidence !== null && (
                <div className="flex items-center justify-between">
                  <span>Confidence Heuristic:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {Math.round(complaint.classificationConfidence * 100)}%
                  </span>
                </div>
              )}

              {complaint.aiRationale && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-slate-600 text-xs leading-relaxed">
                  <span className="font-bold text-slate-800 block mb-1">Assessment Rationale:</span>
                  {complaint.aiRationale}
                </div>
              )}
            </div>
          </div>

          {/* Administrative Score Overrides Notice (if any) */}
          {complaint.scores.hasOverrides && (
            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4 text-xs text-amber-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-amber-700" aria-hidden="true" />
                <span>Administrative Overrides Applied</span>
              </div>
              <p className="text-amber-800 leading-relaxed">
                Justification: "{complaint.overrideReason}"
              </p>
              {complaint.overriddenByName && (
                <div className="text-[11px] text-amber-700 font-medium">
                  By {complaint.overriddenByName} on {new Date(complaint.overriddenAt!).toLocaleDateString()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <StatusUpdateModal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        complaint={complaint}
        onUpdate={handleStatusUpdate}
        userRole={user?.role}
      />

      <FlagReviewModal
        isOpen={flagModalOpen}
        onClose={() => setFlagModalOpen(false)}
        complaintReference={complaint.reference}
        onFlag={handleFlagReview}
      />

      <ManualReviewModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        complaint={complaint}
        onDecision={handleManualReviewDecision}
      />

      <ScoreOverrideModal
        isOpen={overrideModalOpen}
        onClose={() => setOverrideModalOpen(false)}
        complaint={complaint}
        onOverride={handleScoreOverride}
      />
    </div>
  );
};
