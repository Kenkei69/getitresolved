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
import {
  Building2,
  Calendar,
  Clock,
  MapPin,
  Tag,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  Sliders,
  Flag,
  ShieldCheck,
  RotateCw,
  Eye,
} from 'lucide-react';

export const ComplaintDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [complaint, setComplaint] = useState<ComplaintItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [flagModalOpen, setFlagModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [retryingAnalysis, setRetryingAnalysis] = useState(false);

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
    await api.updateStatus(complaint.id, { toStatus, note, isCitizenVisible, explanation });
    await fetchComplaint();
  };

  const handleFlagReview = async (reason: string) => {
    if (!complaint) return;
    await api.flagForReview(complaint.id, reason);
    await fetchComplaint();
  };

  const handleManualReviewDecision = async (categoryId: string, departmentId: string, notes: string) => {
    if (!complaint) return;
    await api.submitManualReviewDecision(complaint.id, {
      categoryId,
      departmentId,
      reviewDecision: 'APPROVED',
      notes,
    });
    await fetchComplaint();
  };

  const handleScoreOverride = async (scores: any) => {
    if (!complaint) return;
    await api.overrideScores(complaint.id, scores);
    await fetchComplaint();
  };

  const handleRetryAnalysis = async () => {
    if (!complaint) return;
    try {
      setRetryingAnalysis(true);
      await api.retryAnalysis(complaint.id);
      await fetchComplaint();
    } catch (err: any) {
      alert(`Retry failed: ${err.message}`);
    } finally {
      setRetryingAnalysis(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-xs text-slate-500">
        Loading complaint tracking data...
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Unable to load complaint</h2>
        <p className="text-xs text-slate-500">{error || 'Complaint not found.'}</p>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to list
        </button>
      </div>
    );
  }

  const isCitizen = user?.role === 'CITIZEN';
  const isStaff = user?.role === 'STAFF';
  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Navigation & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Back to previous screen"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-civic-700">{complaint.reference}</span>
              <StatusBadge status={complaint.status} reviewState={complaint.reviewState} />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">{complaint.title}</h1>
          </div>
        </div>

        {/* Operational Actions (Staff & Admin) */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {isStaff && complaint.status !== 'RESOLVED' && (
            <button
              onClick={() => setStatusModalOpen(true)}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-civic-600 hover:bg-civic-700 rounded-lg shadow-sm transition-colors"
            >
              Update Status
            </button>
          )}

          {isStaff && complaint.reviewState !== 'REQUIRED' && (
            <button
              onClick={() => setFlagModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors"
              title="Flag for administrator review"
            >
              <Flag className="w-3.5 h-3.5" />
              Flag Assignment
            </button>
          )}

          {isAdmin && (
            <>
              {complaint.reviewState === 'REQUIRED' && (
                <button
                  onClick={() => setReviewModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Manual Triage
                </button>
              )}

              <button
                onClick={() => setStatusModalOpen(true)}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
              >
                Change Status
              </button>

              <button
                onClick={() => setOverrideModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <Sliders className="w-3.5 h-3.5" />
                Override Scores
              </button>
            </>
          )}

          {(isStaff || isAdmin) && complaint.analysisState === 'FAILED' && (
            <button
              onClick={handleRetryAnalysis}
              disabled={retryingAnalysis}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <RotateCw className={`w-3.5 h-3.5 ${retryingAnalysis ? 'animate-spin' : ''}`} />
              Retry Analysis
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Details (Left) + Scores & Metadata (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Description, Resolution, Photos, Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Resolution Banner (If resolved) */}
          {complaint.status === 'RESOLVED' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-2">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                Issue Resolved & Closed
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                {complaint.resolutionNote || 'The responsible municipal department has addressed and closed this issue.'}
              </p>
              {complaint.resolvedAt && (
                <div className="text-[11px] text-emerald-700 pt-1">
                  Resolved on: {new Date(complaint.resolvedAt).toLocaleString()}
                </div>
              )}
            </div>
          )}

          {/* Issue Description Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
              Citizen Report Details
            </h2>

            <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">
              {complaint.description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs border-t border-slate-100 text-slate-600">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-800 block">Location:</span>
                  <span>{complaint.address}</span>
                  <span className="block text-slate-400 text-[11px] mt-0.5">
                    {complaint.serviceArea.name} ({complaint.serviceArea.description})
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-800 block">Submitted:</span>
                  <span>{new Date(complaint.createdAt).toLocaleString()}</span>
                  {complaint.firstNoticedDate && (
                    <span className="block text-slate-400 text-[11px] mt-0.5">
                      First noticed: {new Date(complaint.firstNoticedDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Photo Evidence */}
          {complaint.attachments && complaint.attachments.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
              <h2 className="text-sm font-bold text-slate-900">
                Photo Attachments ({complaint.attachments.length})
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {complaint.attachments.map((att) => (
                  <a
                    key={att.id}
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block relative rounded-xl overflow-hidden border border-slate-200 aspect-video group hover:shadow-md transition-all bg-slate-100"
                  >
                    <img src={att.url} alt={att.originalFilename} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/30 transition-all flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 text-white text-xs font-semibold px-2 py-1 rounded bg-slate-900/70 flex items-center gap-1 transition-opacity">
                        <Eye className="w-3.5 h-3.5" /> View
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Status & Progress Timeline */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900">
              {isCitizen ? 'Progress Updates & Timeline' : 'Status History & Updates'}
            </h2>

            {complaint.statusHistory && complaint.statusHistory.length > 0 ? (
              <div className="relative border-l-2 border-slate-200 ml-3 space-y-6 pl-5 py-1">
                {complaint.statusHistory.map((item, idx) => (
                  <div key={item.id} className="relative group">
                    {/* Timeline bullet */}
                    <div className="absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full bg-civic-600 ring-4 ring-white" />
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 uppercase">
                          {item.toStatus.replace('_', ' ')}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(item.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {item.note && (
                        <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                          {item.note}
                        </p>
                      )}
                      {!isCitizen && (
                        <div className="text-[10px] text-slate-400">
                          Updated by: {item.changedByName}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No historical updates recorded.</p>
            )}
          </div>

          {/* Administrative Audit Timeline (Hidden from Citizens) */}
          {!isCitizen && complaint.auditEvents && complaint.auditEvents.length > 0 && (
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
              <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Internal Administrative Audit Trail
              </h2>
              <div className="divide-y divide-slate-200 text-xs">
                {complaint.auditEvents.map((ae) => (
                  <div key={ae.id} className="py-2.5 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800">{ae.action}</span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {new Date(ae.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-slate-600">
                      Actor: <b>{ae.actorName}</b>
                    </div>
                    {ae.details && (
                      <pre className="text-[11px] bg-white p-2 rounded border border-slate-200 overflow-x-auto text-slate-700">
                        {JSON.stringify(ae.details, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (1 Col): Impact Scores, Department Card, AI Metadata */}
        <div className="space-y-6">
          {/* Department Assignment Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
              Department Routing
            </span>

            {complaint.department ? (
              <div className="space-y-1">
                <div className="font-bold text-base text-slate-900 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-civic-600" />
                  {complaint.department.name}
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {complaint.department.description}
                </p>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-purple-600" />
                  Manual Review Required
                </div>
                <p className="text-[11px] text-purple-800">
                  This complaint requires administrator triage before official department assignment.
                </p>
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 space-y-1">
              <div>
                <b>Category:</b> {complaint.category?.name || 'Uncertain / Other'}
              </div>
              <div>
                <b>Ward:</b> {complaint.serviceArea.name}
              </div>
            </div>
          </div>

          {/* Core Score & Stars Breakdown */}
          <ScoreCard scores={complaint.scores} showBreakdown={true} />

          {/* AI Triage & Analysis Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3 text-xs">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
              Automated Analysis Metadata
            </span>

            <div className="space-y-2 text-slate-700">
              <div className="flex items-center justify-between">
                <span>Provider Engine:</span>
                <span className="font-semibold capitalize px-2 py-0.5 rounded bg-slate-100 text-slate-800">
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
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-slate-600 text-[11px] leading-relaxed">
                  <b>Assessment Rationale:</b> {complaint.aiRationale}
                </div>
              )}
            </div>
          </div>

          {/* Human Score Overrides Notice (if any) */}
          {complaint.scores.hasOverrides && (
            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4 text-xs text-amber-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-amber-700" />
                Administrative Score Overrides Applied
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Reason: "{complaint.overrideReason}"
              </p>
              {complaint.overriddenByName && (
                <div className="text-[10px] text-amber-700">
                  By {complaint.overriddenByName} on {new Date(complaint.overriddenAt!).toLocaleDateString()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Modals */}
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
