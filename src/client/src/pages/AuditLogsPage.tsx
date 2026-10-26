import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ClipboardList, Shield, Search, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterQuery, setFilterQuery] = useState('');

  useEffect(() => {
    api.getAuditLogs()
      .then(setLogs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (!filterQuery) return true;
    const q = filterQuery.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.actorName.toLowerCase().includes(q) ||
      (log.complaintReference && log.complaintReference.toLowerCase().includes(q))
    );
  });

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
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              System Audit History
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Immutable chronological record of submissions, routing, status updates, and score overrides.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <label htmlFor="search-audit-logs" className="sr-only">
              Search audit logs
            </label>
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              id="search-audit-logs"
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Search action, actor, or ref..."
              className="w-full text-sm pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-civic-100 focus:border-civic-500"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center text-sm text-slate-500 space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-civic-600 border-t-transparent animate-spin mx-auto" />
          <p>Loading audit events...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-xs">
                  <th scope="col" className="py-3.5 px-4">Timestamp (UTC)</th>
                  <th scope="col" className="py-3.5 px-4">Action</th>
                  <th scope="col" className="py-3.5 px-4">Actor</th>
                  <th scope="col" className="py-3.5 px-4">Complaint Reference</th>
                  <th scope="col" className="py-3.5 px-4">Event Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 text-xs font-medium border border-slate-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-900 block">{log.actorName}</span>
                      <span className="text-xs text-slate-400 block">{log.actorRole}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-civic-700 font-bold">
                      {log.complaintId ? (
                        <Link to={`/complaints/${log.complaintId}`} className="hover:underline">
                          {log.complaintReference || 'View Complaint'}
                        </Link>
                      ) : (
                        <span className="text-slate-400 font-normal">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 max-w-md">
                      <pre className="text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200 overflow-x-auto font-mono text-slate-700 max-h-28">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
