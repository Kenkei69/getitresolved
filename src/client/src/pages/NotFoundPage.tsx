import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 space-y-4">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
        <Building2 className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-extrabold text-slate-900">404 — Page Not Found</h1>
      <p className="text-xs text-slate-500 max-w-sm">
        The requested civic portal page or complaint record does not exist or has moved.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-civic-600 hover:bg-civic-700 rounded-lg shadow-sm transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Return to Home
      </Link>
    </div>
  );
};
