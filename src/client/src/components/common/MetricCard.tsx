import React from 'react';
import { Skeleton } from './LoadingSkeleton';

export interface MetricCardProps {
  label: string;
  value?: number | string | null;
  description?: string;
  icon?: React.ReactNode;
  loading?: boolean;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  description,
  icon,
  loading = false,
  className = '',
}) => {
  return (
    <div className={`bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between ${className}`}>
      <div className="flex items-center justify-between text-slate-500 mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</span>
        {icon && <div className="p-2 rounded-xl bg-slate-50 text-slate-600">{icon}</div>}
      </div>

      <div className="my-1">
        {loading || value === undefined || value === null ? (
          <Skeleton className="h-8 w-20 my-1" />
        ) : (
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {value}
          </div>
        )}
      </div>

      {description && (
        <span className="text-xs text-slate-500 mt-1 block">
          {description}
        </span>
      )}
    </div>
  );
};
