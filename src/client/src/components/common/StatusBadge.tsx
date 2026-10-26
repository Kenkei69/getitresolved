import React from 'react';
import { ComplaintStatus, ReviewState } from '../../../../shared/types';

interface StatusBadgeProps {
  status: ComplaintStatus;
  reviewState?: ReviewState;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, reviewState }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'SUBMITTED':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          dot: 'bg-amber-500',
          label: 'Submitted',
        };
      case 'ASSIGNED':
        return {
          bg: 'bg-blue-50 text-blue-800 border-blue-200',
          dot: 'bg-blue-500',
          label: 'Assigned',
        };
      case 'IN_PROGRESS':
        return {
          bg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
          dot: 'bg-indigo-500 animate-pulse',
          label: 'In Progress',
        };
      case 'RESOLVED':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          dot: 'bg-emerald-500',
          label: 'Resolved',
        };
      default:
        return {
          bg: 'bg-slate-100 text-slate-800 border-slate-200',
          dot: 'bg-slate-400',
          label: status,
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="inline-flex items-center gap-1.5">
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.bg}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} aria-hidden="true" />
        {config.label}
      </span>

      {reviewState === 'REQUIRED' && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200" title="Flagged for administrative review">
          Manual Review Required
        </span>
      )}
    </div>
  );
};
