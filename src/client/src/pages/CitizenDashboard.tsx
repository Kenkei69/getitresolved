import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ComplaintItem, DashboardStats } from '../../../shared/types';
import { ComplaintTable } from '../components/complaint/ComplaintTable';
import { FilterBar } from '../components/complaint/FilterBar';
import { MetricCard } from '../components/common/MetricCard';
import { Alert } from '../components/common/Alert';
import { Button } from '../components/common/Button';
import { PlusCircle, FileText, CheckCircle2, Clock, AlertCircle, RefreshCw } from 'lucide-react';

export const CitizenDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [filters, setFilters] = useState<any>({ page: 1, limit: 10, sortBy: 'coreScore', sortOrder: 'desc' });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stale request protection
  const latestRequestId = useRef(0);

  const fetchDashboardData = async (isBackground = false) => {
    const requestId = ++latestRequestId.current;

    try {
      if (isBackground) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const [statsData, listData] = await Promise.all([
        api.getDashboardStats(),
        api.listComplaints(filters),
      ]);

      // Only update state if this is the newest request
      if (requestId === latestRequestId.current) {
        setStats(statsData);
        setComplaints(listData.items);
        setPagination(listData.pagination);
      }
    } catch (err: any) {
      if (requestId === latestRequestId.current) {
        setError(err.message || 'Unable to load dashboard data. Please check your connection.');
      }
    } finally {
      if (requestId === latestRequestId.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    // If we already have complaints loaded, do a background refresh to prevent layout flicker
    const isBackground = complaints.length > 0;
    fetchDashboardData(isBackground);
  }, [filters]);

  const handleResetFilters = () => {
    setFilters({ page: 1, limit: 10, sortBy: 'coreScore', sortOrder: 'desc' });
  };

  const hasActiveFilters =
    !!filters.search ||
    !!filters.categoryId ||
    !!filters.serviceAreaId ||
    !!filters.status ||
    filters.starRed === 'true' ||
    filters.starPink === 'true' ||
    filters.starOrange === 'true' ||
    filters.starGreen === 'true' ||
    filters.sortBy !== 'coreScore';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Citizen Dashboard</h1>
          <p className="text-sm text-slate-600 mt-1">
            Welcome back, <span className="font-semibold text-slate-800">{user?.name}</span>. Track the real-time status of your reported issues below.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {refreshing && (
            <span className="text-xs text-slate-400 flex items-center gap-1.5 animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Updating...
            </span>
          )}
          <Link
            to="/submit"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-civic-600 hover:bg-civic-700 rounded-xl shadow-xs transition-colors min-h-[42px]"
          >
            <PlusCircle className="w-4 h-4" aria-hidden="true" />
            <span>Report an Issue</span>
          </Link>
        </div>
      </div>

      {/* Visible Error Banner with Retry */}
      {error && (
        <Alert
          variant="error"
          title="Could not load complaints"
          action={{
            label: 'Retry Loading',
            onClick: () => fetchDashboardData(false),
          }}
        >
          {error}
        </Alert>
      )}

      {/* Summary Metric Cards (Displays skeletons while loading rather than fake zeroes) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard
          label="Total Submitted"
          value={stats?.totalComplaints}
          loading={loading && !stats}
          description="Your filed complaints"
          icon={<FileText className="w-5 h-5 text-civic-600" aria-hidden="true" />}
        />
        <MetricCard
          label="Awaiting / Assigned"
          value={stats?.openComplaints}
          loading={loading && !stats}
          description="In department queue"
          icon={<Clock className="w-5 h-5 text-amber-500" aria-hidden="true" />}
        />
        <MetricCard
          label="In Progress"
          value={stats?.inProgressComplaints}
          loading={loading && !stats}
          description="Active remediation"
          icon={<AlertCircle className="w-5 h-5 text-indigo-500" aria-hidden="true" />}
        />
        <MetricCard
          label="Resolved"
          value={stats?.resolvedComplaints}
          loading={loading && !stats}
          description="Completed and closed"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" aria-hidden="true" />}
        />
      </div>

      {/* Complaints List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Your Submitted Complaints</h2>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
            {pagination.total} {pagination.total === 1 ? 'record' : 'records'}
          </span>
        </div>

        <FilterBar
          filters={filters}
          onChange={(newF) => setFilters(newF)}
          showDepartmentFilter={false}
          showReviewFilter={false}
        />

        {loading && !complaints.length ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-sm text-slate-500 space-y-2">
            <div className="w-8 h-8 rounded-full border-2 border-civic-600 border-t-transparent animate-spin mx-auto" />
            <p>Loading your submitted complaints...</p>
          </div>
        ) : (
          <ComplaintTable
            complaints={complaints}
            pagination={pagination}
            onPageChange={(p) => setFilters({ ...filters, page: p })}
            showDepartmentCol={true}
            userRole={user?.role}
            isFiltered={hasActiveFilters}
            onResetFilters={handleResetFilters}
          />
        )}
      </div>
    </div>
  );
};
