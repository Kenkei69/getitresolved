import React from 'react';
import { Link } from 'react-router-dom';
import { ComplaintItem } from '../../../../shared/types';
import { StatusBadge } from '../common/StatusBadge';
import { StarBadge } from '../common/StarBadge';
import { EmptyState } from '../common/EmptyState';
import { ChevronLeft, ChevronRight, Inbox, Clock, MapPin, PlusCircle, MessageSquare } from 'lucide-react';

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
  isFiltered?: boolean;
  onResetFilters?: () => void;
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
  isFiltered = false,
  onResetFilters,
}) => {
  if (complaints.length === 0) {
    if (isFiltered) {
      return (
        <EmptyState
          title="No complaints match your filters"
          description="Try adjusting or clearing your search term, department, status, or star criteria."
          secondaryAction={
            onResetFilters
              ? {
                  label: 'Reset All Filters',
                  onClick: onResetFilters,
                }
              : undefined
          }
        />
      );
    }

    return (
      <EmptyState
        title="No complaints submitted yet"
        description="When you report a local issue, you will see its live progress, assigned department, and resolution timeline here."
        action={
          userRole === 'CITIZEN' || !userRole
            ? {
                label: 'Report an Issue',
                href: '/submit',
                icon: <PlusCircle className="w-4 h-4" />,
              }
            : undefined
        }
      />
    );
  }

  const startCount = (pagination.page - 1) * pagination.limit + 1;
  const endCount = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <div className="space-y-4">
      {/* Desktop Table (> 768px) */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-xs">
                <th scope="col" className="py-3.5 px-4">Complaint / Reference</th>
                <th scope="col" className="py-3.5 px-4">Category & Location</th>
                {showDepartmentCol && <th scope="col" className="py-3.5 px-4">Assigned Department</th>}
                <th scope="col" className="py-3.5 px-4 text-center">Core Score</th>
                <th scope="col" className="py-3.5 px-4">Indicator Stars</th>
                <th scope="col" className="py-3.5 px-4">Age / Duration</th>
                <th scope="col" className="py-3.5 px-4">Status</th>
                <th scope="col" className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {complaints.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                  {/* Reference & Title */}
                  <td className="py-3.5 px-4 max-w-xs">
                    <span className="font-mono text-xs font-bold text-civic-700 block">
                      {c.reference}
                    </span>
                    <Link
                      to={`/complaints/${c.id}`}
                      className="font-semibold text-slate-900 hover:text-civic-700 line-clamp-1 mt-0.5"
                    >
                      {c.title}
                    </Link>
                    <div className="text-xs text-slate-500 truncate mt-0.5">{c.address}</div>
                  </td>

                  {/* Category & Service Area */}
                  <td className="py-3.5 px-4">
                    <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                      {c.category?.name || 'Unassigned / Triage'}
                    </span>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                      <span>{c.serviceArea.name}</span>
                    </div>
                  </td>

                  {/* Department */}
                  {showDepartmentCol && (
                    <td className="py-3.5 px-4">
                      {c.department ? (
                        <span className="text-sm font-medium text-slate-800 block">
                          {c.department.name}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200">
                          Needs Admin Triage
                        </span>
                      )}
                    </td>
                  )}

                  {/* Core Score */}
                  <td className="py-3.5 px-4 text-center">
                    <div className="inline-flex items-baseline gap-0.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 font-mono font-bold text-slate-900">
                      <span className="text-sm">{c.scores.coreScore.toFixed(1)}</span>
                      <span className="text-xs text-slate-400 font-normal">/10</span>
                    </div>
                    {c.scores.hasOverrides && (
                      <span className="block text-[11px] text-amber-700 font-medium mt-0.5">Overridden</span>
                    )}
                  </td>

                  {/* Star indicators */}
                  <td className="py-3.5 px-4">
                    <StarBadge stars={c.scores.stars} size="sm" />
                  </td>

                  {/* Age */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-700 text-xs">
                    <div className="flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                      <span>{c.scores.unresolvedAgeDays} days</span>
                    </div>
                    <div className="text-slate-400 text-[11px] mt-0.5">
                      Duration: {c.scores.durationScore}/10
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4">
                    <StatusBadge status={c.status} reviewState={c.reviewState} />
                  </td>

                  {/* Row Actions */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        to={`/complaints/${c.id}`}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors min-h-[32px] inline-flex items-center"
                      >
                        Details
                      </Link>

                      {/* Staff quick status update */}
                      {userRole === 'STAFF' && onOpenStatusModal && c.status !== 'RESOLVED' && (
                        <button
                          type="button"
                          onClick={() => onOpenStatusModal(c)}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-civic-600 hover:bg-civic-700 rounded-lg transition-colors shadow-xs min-h-[32px]"
                        >
                          Update
                        </button>
                      )}

                      {/* Staff quick flag */}
                      {userRole === 'STAFF' && onOpenFlagModal && c.reviewState !== 'REQUIRED' && (
                        <button
                          type="button"
                          onClick={() => onOpenFlagModal(c)}
                          className="px-2.5 py-1.5 text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors min-h-[32px]"
                          title="Flag incorrect department assignment"
                        >
                          Flag
                        </button>
                      )}

                      {/* Admin manual triage button */}
                      {userRole === 'ADMIN' && onOpenReviewModal && c.reviewState === 'REQUIRED' && (
                        <button
                          type="button"
                          onClick={() => onOpenReviewModal(c)}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors shadow-xs min-h-[32px]"
                        >
                          Triage
                        </button>
                      )}

                      {/* Admin score override button */}
                      {userRole === 'ADMIN' && onOpenOverrideModal && (
                        <button
                          type="button"
                          onClick={() => onOpenOverrideModal(c)}
                          className="px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors min-h-[32px]"
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
      <div className="md:hidden space-y-3.5">
        {complaints.map((c) => (
          <div key={c.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3.5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="font-mono text-xs font-bold text-civic-700">{c.reference}</span>
                <Link to={`/complaints/${c.id}`} className="block font-bold text-base text-slate-900 mt-1 leading-snug">
                  {c.title}
                </Link>
                <div className="text-xs text-slate-500 mt-0.5">{c.address}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="inline-flex items-baseline gap-0.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 font-mono font-bold text-slate-900 text-sm">
                  {c.scores.coreScore.toFixed(1)}
                  <span className="text-[10px] text-slate-400 font-normal">/10</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 pt-1 border-t border-slate-100">
              <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 font-medium">
                {c.category?.name || 'Unassigned'}
              </span>
              <span>&bull;</span>
              <span>{c.serviceArea.name}</span>
              <span>&bull;</span>
              <span>{c.scores.unresolvedAgeDays}d old</span>
            </div>

            <div className="flex items-center justify-between pt-1 text-xs">
              <StatusBadge status={c.status} reviewState={c.reviewState} />
              <StarBadge stars={c.scores.stars} size="sm" />
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
              <Link
                to={`/complaints/${c.id}`}
                className="w-full text-center px-4 py-2.5 text-sm font-semibold text-civic-700 bg-civic-50 hover:bg-civic-100 rounded-xl transition-colors min-h-[44px] flex items-center justify-center"
              >
                View Full Details &rarr;
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Footer */}
      <div className="bg-white rounded-2xl border border-slate-200 px-5 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs text-sm text-slate-600">
        <div>
          Showing <span className="font-semibold text-slate-900">{startCount}</span> to{' '}
          <span className="font-semibold text-slate-900">{endCount}</span> of{' '}
          <span className="font-semibold text-slate-900">{pagination.total}</span> complaints
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={pagination.page <= 1}
            onClick={() => onPageChange(pagination.page - 1)}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors min-w-[38px] min-h-[38px] flex items-center justify-center"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-semibold text-slate-800 text-xs sm:text-sm px-2">
            Page {pagination.page} of {pagination.totalPages || 1}
          </span>
          <button
            type="button"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => onPageChange(pagination.page + 1)}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors min-w-[38px] min-h-[38px] flex items-center justify-center"
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
