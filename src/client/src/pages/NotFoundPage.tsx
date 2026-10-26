import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, ArrowLeft, PlusCircle, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const NotFoundPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-16 space-y-6 max-w-md mx-auto">
      <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-500 shadow-2xs">
        <Building2 className="w-8 h-8" aria-hidden="true" />
      </div>

      <div className="space-y-2">
        <span className="text-xs font-bold text-civic-700 uppercase tracking-widest block">
          Error 404
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Page Not Found
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          The requested page or complaint reference does not exist, has been archived, or you may not have authorization to view it.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-civic-600 hover:bg-civic-700 rounded-xl shadow-xs transition-colors min-h-[42px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return Home</span>
        </Link>

        {user ? (
          <Link
            to={
              user.role === 'ADMIN'
                ? '/admin/dashboard'
                : user.role === 'STAFF'
                ? '/staff/queue'
                : '/dashboard'
            }
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors min-h-[42px]"
          >
            <LayoutDashboard className="w-4 h-4 text-slate-500" />
            <span>Go to Dashboard</span>
          </Link>
        ) : (
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors min-h-[42px]"
          >
            <span>Sign In</span>
          </Link>
        )}
      </div>
    </div>
  );
};
