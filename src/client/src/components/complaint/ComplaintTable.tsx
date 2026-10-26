import React from 'react';
import { Link } from 'react-router-dom';
import { ComplaintItem } from '../../../../shared/types';
import { StatusBadge } from '../common/StatusBadge';
import { StarBadge } from '../common/StarBadge';
import { ArrowUpDown, ChevronLeft, ChevronRight, Inbox, Clock, MapPin, Tag } from 'lucide-react';

interface ComplaintTableProps {
  complaints: ComplaintItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  onPageChange: (newPage: number) => void;
  showDepartmentCol?: boolean;
  onOpenStatusModal?: (complaint: ComplaintItem) => void;
  onOpenFlagModal?: (complaint: ComplaintItem) => void;
  onOpenReviewModal?: (complaint: ComplaintItem) => void;
  onOpenOverrideModal?: (complaint: ComplaintItem) => void;
  userRole?: string;
}

export const ComplaintTable: React.FC<ComplaintTableProps> = ({
  complaints,
  pagination,
  onPageChange,
  showDepartmentCol = true,
  onOpenStatusModal,
  onOpenFlagModal,
  onOpenReviewModal,
  onOpenOverrideModal,
  userRole,
}) => {
  if (complaints.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
          <Inbox className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-900">No complaints found</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
          No complaints match the specified search query or active filter criteria. Try resetting filters.
        </p>
      </div>
    );
  }

  const startCount = (pagination.page - 1) * pagination.limit + 1;
  const endCount = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <div className="space-y-4">
      {/* Desktop Table (> 768px) */}
      <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th scope="col" className="py-3.5 px-4">Complaint / Title</th>
                <th scope="col" className="py-3.5 px-4">Category & Area</th>
                {showDepartmentCol && <th scope="col" className="py-3.5 px-4">Assigned Department</th>}
                <th scope="col" className="py-3.5 px-4 text-center">Core Score</th>
                <th scope="col" className="py-3.5 px-4">Threshold Stars (&gt; 7)</th>
                <th scope="col" className="py-3.5 px-4">Age / Duration</th>
                <th scope="col" className="py-3.5 px-4">Status</th>
                <th scope="col" className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {complaints.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* Reference & Title */}
                  <td className="py-3 px-4 max-w-xs">
                    <div className="font-mono text-[11px] font-bold text-civic-700">
                      {c.reference}
                    </div>
                    <Link
                      to={`/complaints/${c.id}`}
                      className="font-medium text-slate-900 hover:text-civic-600 line-clamp-1 mt-0.5"
                    >
                      {c.title}
                    </Link>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">{c.address}</div>
                  </td>

                  {/* Category & Service Area */}
                  <td className="py-3 px-4">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-800 border border-slate-200">
                      {c.category?.name || 'Unassigned / Other'}
                    </span>
                    <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {c.serviceArea.name}
                    </div>
                  </td>

                  {/* Department */}
                  {showDepartmentCol && (
                    <td className="py-3 px-4">
                      {c.department ? (
                        <span className="text-xs font-medium text-slate-800">
                          {c.department.name}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                          Needs Admin Triage
                        </span>
                      )}
                    </td>
                  )}

                  {/* Core Score */}
                  <td className="py-3 px-4 text-center">
                    <div className="inline-flex items-baseline gap-0.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-200 font-mono font-bold text-slate-900">
                      <span className="text-sm">{c.scores.coreScore.toFixed(1)}</span>
                      <span className="text-[10px] text-slate-400 font-normal">/10</span>
                    </div>
                    {c.scores.hasOverrides && (
                      <span className="block text-[10px] text-amber-600 font-medium">Overridden</span>
                    )}
                  </td>

                  {/* Star indicators */}
                  <td className="py-3 px-4">
                    <StarBadge stars={c.scores.stars} size="sm" />
                  </td>

                  {/* Age */}
                  <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{c.scores.unresolvedAgeDays} days</span>
                    </div>
                    <div className="text-[10px] text-slate-400">Score: {c.scores.durationScore}/10</div>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4">
                    <StatusBadge status={c.status} reviewState={c.reviewState} />
                  </td>

                  {/* Row Actions */}
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        to={`/complaints/${c.id}`}
                        className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                      >
                        Details
                      </Link>

                      {/* Staff quick status update */}
                      {userRole === 'STAFF' && onOpenStatusModal && c.status !== 'RESOLVED' && (
                        <button
                          type="button"
                          onClick={() => onOpenStatusModal(c)}
                          className="px-2.5 py-1 text-xs font-semibold text-white bg-civic-600 hover:bg-civic-700 rounded-md transition-colors shadow-sm"
                        >
                          Update
                        </button>
                      )}

                      {/* Staff quick flag */}
                      {userRole === 'STAFF' && onOpenFlagModal && c.reviewState !== 'REQUIRED' && (
                        <button
                          type="button"
                          onClick={() => onOpenFlagModal(c)}
                          className="px-2 py-1 text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-md transition-colors"
                          title="Flag incorrect assignment for administrator triage"
                        >
                          Flag
                        </button>
                      )}

                      {/* Admin manual triage button */}
                      {userRole === 'ADMIN' && onOpenReviewModal && c.reviewState === 'REQUIRED' && (
                        <button
                          type="button"
                          onClick={() => onOpenReviewModal(c)}
                          className="px-2.5 py-1 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-md transition-colors shadow-sm"
                        >
                          Review
                        </button>
                      )}

                      {/* Admin score override button */}
                      {userRole === 'ADMIN' && onOpenOverrideModal && (
                        <button
                          type="button"
                          onClick={() => onOpenOverrideModal(c)}
                          className="px-2 py-1 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                          title="Override impact scores"
                        >
                          Scores
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card Layout (< 768px) */}
      <div className="md:hidden space-y-3">
        {complaints.map((c) => (
          <div key={c.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="font-mono text-xs font-bold text-civic-700">{c.reference}</span>
                <Link to={`/complaints/${c.id}`} className="block font-semibold text-sm text-slate-900 mt-0.5">
                  {c.title}
                </Link>
              </div>
              <div className="text-right shrink-0">
                <div className="inline-flex items-baseline gap-0.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-200 font-mono font-bold text-slate-900 text-sm">
                  {c.scores.coreScore.toFixed(1)}
                  <span className="text-[10px] text-slate-400 font-normal">/10</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-medium">
                {c.category?.name || 'Unassigned'}
              </span>
              <span>&bull;</span>
              <span>{c.serviceArea.name}</span>
              <span>&bull;</span>
              <span>{c.scores.unresolvedAgeDays}d old</span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <StatusBadge status={c.status} reviewState={c.reviewState} />
              <StarBadge stars={c.scores.stars} size="sm" />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Link
                to={`/complaints/${c.id}`}
                className="w-full text-center px-3 py-1.5 text-xs font-semibold text-civic-700 bg-civic-50 hover:bg-civic-100 rounded-lg transition-colors"
              >
                View Full Details &rarr;
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Footer */}
      <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm text-xs text-slate-600">
        <div>
          Showing <b>{startCount}</b> to <b>{endCount}</b> of <b>{pagination.total}</b> complaints
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={pagination.page <= 1}
            onClick={() => onPageChange(pagination.page - 1)}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-semibold text-slate-800">
            Page {pagination.page} of {pagination.totalPages || 1}
          </span>
          <button
            type="button"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => onPageChange(pagination.page + 1)}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
