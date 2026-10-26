import React from 'react';
import { ComplaintStatus, ReviewState } from '../../../../shared/types';

interface StatusBadgeProps {
  status: ComplaintStatus;
  reviewState?: ReviewState;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, reviewState, className = '' }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'SUBMITTED':
        return {
          bg: 'bg-amber-50 text-amber-900 border-amber-200',
          dot: 'bg-amber-500',
          label: 'Submitted',
        };
      case 'ASSIGNED':
        return {
          bg: 'bg-blue-50 text-blue-900 border-blue-200',
          dot: 'bg-blue-600',
          label: 'Assigned',
        };
      case 'IN_PROGRESS':
        return {
          bg: 'bg-indigo-50 text-indigo-900 border-indigo-200',
          dot: 'bg-indigo-600 animate-pulse',
          label: 'In Progress',
        };
      case 'RESOLVED':
        return {
          bg: 'bg-emerald-50 text-emerald-900 border-emerald-200',
          dot: 'bg-emerald-600',
          label: 'Resolved',
        };
      default:
        return {
          bg: 'bg-slate-100 text-slate-800 border-slate-200',
          dot: 'bg-slate-500',
          label: status,
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`inline-flex flex-wrap items-center gap-1.5 ${className}`}>
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} aria-hidden="true" />
        <span>{config.label}</span>
      </span>

      {reviewState === 'REQUIRED' && (
        <span
          className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-900 border border-purple-200"
          title="Flagged for administrative review and manual department assignment"
        >
          Review Required
        </span>
      )}
    </div>
  );
};
