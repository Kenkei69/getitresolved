import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ComplaintItem } from '../../../shared/types';
import { StatusBadge } from '../components/common/StatusBadge';
import { StarBadge } from '../components/common/StarBadge';
import { ManualReviewModal } from '../components/complaint/ManualReviewModal';
import { Link } from 'react-router-dom';
import { ShieldAlert, AlertCircle, CheckCircle2, Clock, MapPin, Sparkles } from 'lucide-react';

export const ManualReviewPage: React.FC = () => {
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeComplaint, setActiveComplaint] = useState<ComplaintItem | null>(null);

  const fetchReviewQueue = async () => {
    try {
      setLoading(true);
      const data = await api.listComplaints({
        reviewState: 'REQUIRED',
        limit: 50,
      });
      setComplaints(data.items);
    } catch (err) {
      console.error('Failed to load manual review queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviewQueue();
  }, []);

  const handleReviewDecision = async (categoryId: string, departmentId: string, notes: string) => {
    if (!activeComplaint) return;
    await api.submitManualReviewDecision(activeComplaint.id, {
      categoryId,
      departmentId,
      reviewDecision: 'APPROVED',
      notes,
    });
    await fetchReviewQueue();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-pulse" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Manual Review Queue</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Complaints diverted from automatic routing due to uncertainty, low confidence (&lt; 75%), or staff flagging.
          </p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
          {complaints.length} Pending Triage
        </span>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-xs text-slate-400">
          Loading triage queue...
        </div>
      ) : complaints.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900">Manual review queue is clear</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            All submitted citizen complaints have been successfully categorized and routed to their responsible departments.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {complaints.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-2xl border border-purple-200 p-5 shadow-sm hover:border-purple-300 transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-civic-700">{c.reference}</span>
                    <StatusBadge status={c.status} reviewState={c.reviewState} />
                    <StarBadge stars={c.scores.stars} size="sm" />
                  </div>
                  <h3 className="font-bold text-base text-slate-900">{c.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {c.serviceArea.name} ({c.address})
                    </span>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {c.scores.unresolvedAgeDays}d old
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    to={`/complaints/${c.id}`}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    View Details
                  </Link>
                  <button
                    onClick={() => setActiveComplaint(c)}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Review & Assign
                  </button>
                </div>
              </div>

              {/* Rationale / Triage Trigger Notice */}
              <div className="bg-purple-50/70 border border-purple-100 rounded-xl p-3 text-xs text-purple-950 space-y-1">
                <div className="font-semibold flex items-center gap-1.5 text-purple-900">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  Review Trigger Diagnostic:
                </div>
                <p className="text-[11px] text-purple-900/90 leading-relaxed">
                  {c.aiRationale || 'Complaint category is Other / uncertain or routing rule missing for specified service area.'}
                </p>
                {c.classificationConfidence !== null && (
                  <div className="text-[11px] text-purple-700">
                    Classification Confidence: <b>{Math.round(c.classificationConfidence * 100)}%</b> (Threshold: 75%)
                  </div>
                )}
              </div>

              <p className="text-xs text-slate-600 line-clamp-2">{c.description}</p>
            </div>
          ))}
        </div>
      )}

      {activeComplaint && (
        <ManualReviewModal
          isOpen={!!activeComplaint}
          onClose={() => setActiveComplaint(null)}
          complaint={activeComplaint}
          onDecision={handleReviewDecision}
        />
      )}
    </div>
  );
};
