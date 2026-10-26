import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ComplaintItem } from '../../../shared/types';
import { StatusBadge } from '../components/common/StatusBadge';
import { StarBadge } from '../components/common/StarBadge';
import { ManualReviewModal } from '../components/complaint/ManualReviewModal';
import { Alert } from '../components/common/Alert';
import { Button } from '../components/common/Button';
import { Link } from 'react-router-dom';
import { ShieldAlert, ShieldCheck, AlertCircle, CheckCircle2, Clock, MapPin, Sparkles, ArrowLeft, ArrowRight } from 'lucide-react';

export const ManualReviewPage: React.FC = () => {
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [activeComplaint, setActiveComplaint] = useState<ComplaintItem | null>(null);

  const fetchReviewQueue = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.listComplaints({
        reviewState: 'REQUIRED',
        limit: 50,
      });
      setComplaints(data.items);
    } catch (err: any) {
      setError(err.message || 'Failed to load manual review queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviewQueue();
  }, []);

  const handleReviewDecision = async (categoryId: string, departmentId: string, notes: string) => {
    if (!activeComplaint) return;
    try {
      await api.submitManualReviewDecision(activeComplaint.id, {
        categoryId,
        departmentId,
        reviewDecision: 'APPROVED',
        notes,
      });
      setActionNotice({ type: 'success', message: `Complaint ${activeComplaint.reference} successfully categorized and routed.` });
      setTimeout(() => setActionNotice(null), 4000);
      await fetchReviewQueue();
    } catch (err: any) {
      setActionNotice({ type: 'error', message: err.message || 'Failed to record triage decision.' });
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Breadcrumb */}
      <div className="space-y-4 border-b border-slate-200/80 pb-6">
        <Link
          to="/admin/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Back to Administration Overview</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-purple-600 animate-pulse" />
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Manual Review Queue
              </h1>
            </div>
            <p className="text-sm text-slate-600 mt-1">
              Complaints diverted from automatic routing due to ambiguity, low AI confidence (&lt; 75%), or department staff flagging.
            </p>
          </div>

          <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-purple-100 text-purple-900 border border-purple-200 self-start sm:self-auto">
            {complaints.length} Pending Review
          </span>
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

      {error && (
        <Alert
          variant="error"
          title="Queue Error"
          action={{
            label: 'Retry Loading',
            onClick: fetchReviewQueue,
          }}
        >
          {error}
        </Alert>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center text-sm text-slate-500 space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-purple-600 border-t-transparent animate-spin mx-auto" />
          <p>Loading triage queue...</p>
        </div>
      ) : complaints.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 max-w-md mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Manual review queue is clear</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            All submitted citizen complaints have been verified, categorized, and assigned to their respective municipal departments.
          </p>
          <Link
            to="/admin/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-civic-700 hover:text-civic-900 pt-2"
          >
            <span>Return to Overview</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {complaints.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-2xl border border-purple-200 p-6 shadow-xs hover:border-purple-300 transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-civic-700">{c.reference}</span>
                    <StatusBadge status={c.status} reviewState={c.reviewState} />
                    <StarBadge stars={c.scores.stars} size="sm" />
                  </div>
                  <h3 className="font-bold text-lg text-slate-900">{c.title}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {c.serviceArea.name} ({c.address})
                    </span>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {c.scores.unresolvedAgeDays}d unresolved
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                  <Link
                    to={`/complaints/${c.id}`}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors min-h-[38px] inline-flex items-center"
                  >
                    View Details
                  </Link>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setActiveComplaint(c)}
                    className="bg-purple-600 hover:bg-purple-700 shadow-xs"
                    icon={<ShieldCheck className="w-4 h-4" />}
                  >
                    Triage & Assign
                  </Button>
                </div>
              </div>

              <p className="text-sm text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed">
                {c.description}
              </p>

              {c.aiRationale && (
                <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-100 text-xs text-purple-900 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Triage Rationale:</span>
                    <span>{c.aiRationale}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Manual Review Modal */}
      <ManualReviewModal
        isOpen={!!activeComplaint}
        onClose={() => setActiveComplaint(null)}
        complaint={activeComplaint}
        onDecision={handleReviewDecision}
      />
    </div>
  );
};
