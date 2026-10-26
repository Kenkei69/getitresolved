import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
  onDismiss?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  onDismiss,
  action,
  className = '',
}) => {
  const config = {
    info: {
      bg: 'bg-civic-50 border-civic-200 text-civic-900',
      icon: <Info className="w-5 h-5 text-civic-600 shrink-0 mt-0.5" aria-hidden="true" />,
      actionBtn: 'bg-civic-100 text-civic-800 hover:bg-civic-200',
    },
    success: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />,
      actionBtn: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200',
    },
    warning: {
      bg: 'bg-amber-50 border-amber-200 text-amber-900',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />,
      actionBtn: 'bg-amber-100 text-amber-800 hover:bg-amber-200',
    },
    error: {
      bg: 'bg-red-50 border-red-200 text-red-900',
      icon: <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />,
      actionBtn: 'bg-red-100 text-red-800 hover:bg-red-200',
    },
  }[variant];

  return (
    <div
      role="alert"
      className={`p-4 rounded-xl border flex items-start justify-between gap-3 text-sm leading-relaxed ${config.bg} ${className}`}
    >
      <div className="flex items-start gap-3 flex-1">
        {config.icon}
        <div className="space-y-1">
          {title && <h4 className="font-semibold text-slate-900">{title}</h4>}
          <div className="text-slate-700">{children}</div>
          {action && (
            <div className="pt-2">
              <button
                type="button"
                onClick={action.onClick}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${config.actionBtn}`}
              >
                {action.label}
              </button>
            </div>
          )}
        </div>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
          aria-label="Dismiss alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
