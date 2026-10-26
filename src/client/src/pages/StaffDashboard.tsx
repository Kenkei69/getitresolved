import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ComplaintItem, DashboardStats } from '../../../shared/types';
import { ComplaintTable } from '../components/complaint/ComplaintTable';
import { FilterBar } from '../components/complaint/FilterBar';
import { StatusUpdateModal } from '../components/complaint/StatusUpdateModal';
import { FlagReviewModal } from '../components/complaint/FlagReviewModal';
import { MetricCard } from '../components/common/MetricCard';
import { Alert } from '../components/common/Alert';
import { Building2, Clock, AlertCircle, CheckCircle2, HardHat, RefreshCw } from 'lucide-react';

export const StaffDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [filters, setFilters] = useState<any>({ page: 1, limit: 15, sortBy: 'coreScore', sortOrder: 'desc' });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Active modals
  const [activeComplaintForStatus, setActiveComplaintForStatus] = useState<ComplaintItem | null>(null);
  const [activeComplaintForFlag, setActiveComplaintForFlag] = useState<ComplaintItem | null>(null);

  const latestRequestId = useRef(0);

  const fetchStaffData = async (isBackground = false) => {
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

      if (requestId === latestRequestId.current) {
        setStats(statsData);
        setComplaints(listData.items);
        setPagination(listData.pagination);
      }
    } catch (err: any) {
      if (requestId === latestRequestId.current) {
        setError(err.message || 'Failed to load department queue data.');
      }
    } finally {
      if (requestId === latestRequestId.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    const isBackground = complaints.length > 0;
    fetchStaffData(isBackground);
  }, [filters]);

  const handleStatusUpdate = async (toStatus: any, note: string, isCitizenVisible: boolean, explanation?: string) => {
    if (!activeComplaintForStatus) return;
    try {
      await api.updateStatus(activeComplaintForStatus.id, { toStatus, note, isCitizenVisible, explanation });
      setActionNotice({ type: 'success', message: 'Complaint status updated successfully.' });
      setTimeout(() => setActionNotice(null), 4000);
      await fetchStaffData(true);
    } catch (err: any) {
      setActionNotice({ type: 'error', message: err.message || 'Failed to update status.' });
    }
  };

  const handleFlagReview = async (reason: string) => {
    if (!activeComplaintForFlag) return;
    try {
      await api.flagForReview(activeComplaintForFlag.id, reason);
      setActionNotice({ type: 'success', message: 'Complaint flagged for administrator review.' });
      setTimeout(() => setActionNotice(null), 4000);
      await fetchStaffData(true);
    } catch (err: any) {
      setActionNotice({ type: 'error', message: err.message || 'Failed to flag assignment.' });
    }
  };

  const handleResetFilters = () => {
    setFilters({ page: 1, limit: 15, sortBy: 'coreScore', sortOrder: 'desc' });
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
      {/* Department Operations Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200 shadow-2xs">
            <HardHat className="w-7 h-7" aria-hidden="true" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                Department Operations Queue
              </span>
              <span className="text-xs text-slate-500 font-medium">Logged in as {user?.name}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 tracking-tight">
              {user?.department?.name || 'Department Staff Queue'}
            </h1>
            <p className="text-sm text-slate-600 mt-0.5">
              {user?.department?.description || 'Municipal Service Division'}
            </p>
          </div>
        </div>

        {refreshing && (
          <span className="text-xs text-slate-400 flex items-center gap-1.5 self-start sm:self-center animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            Updating queue...
          </span>
        )}
      </div>

      {actionNotice && (
        <Alert
          variant={actionNotice.type === 'success' ? 'success' : 'error'}
          onDismiss={() => setActionNotice(null)}
        >
          {actionNotice.message}
        </Alert>
      )}

      {error && (
        <Alert
          variant="error"
          title="Queue Loading Error"
          action={{
            label: 'Retry Loading',
            onClick: () => fetchStaffData(false),
          }}
        >
          {error}
        </Alert>
      )}

      {/* Department Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard
          label="Total Assigned"
          value={stats?.totalComplaints}
          loading={loading && !stats}
          description="Total active queue items"
          icon={<Building2 className="w-5 h-5 text-civic-600" aria-hidden="true" />}
        />
        <MetricCard
          label="Awaiting Action"
          value={stats?.openComplaints}
          loading={loading && !stats}
          description="Assigned, not started"
          icon={<Clock className="w-5 h-5 text-amber-500" aria-hidden="true" />}
        />
        <MetricCard
          label="Under Review / Progress"
          value={stats?.inProgressComplaints}
          loading={loading && !stats}
          description="Active remediation"
          icon={<AlertCircle className="w-5 h-5 text-indigo-500" aria-hidden="true" />}
        />
        <MetricCard
          label="Completed & Closed"
          value={stats?.resolvedComplaints}
          loading={loading && !stats}
          description="Resolved by team"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" aria-hidden="true" />}
        />
      </div>

      {/* Department Complaint Queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Assigned Complaints</h2>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
            {pagination.total} {pagination.total === 1 ? 'item' : 'items'}
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
            <p>Loading assigned complaints...</p>
          </div>
        ) : (
          <ComplaintTable
            complaints={complaints}
            pagination={pagination}
            onPageChange={(p) => setFilters({ ...filters, page: p })}
            showDepartmentCol={false}
            onOpenStatusModal={(c) => setActiveComplaintForStatus(c)}
            onOpenFlagModal={(c) => setActiveComplaintForFlag(c)}
            userRole="STAFF"
            isFiltered={hasActiveFilters}
            onResetFilters={handleResetFilters}
          />
        )}
      </div>

      {/* Action Modals */}
      <StatusUpdateModal
        isOpen={!!activeComplaintForStatus}
        onClose={() => setActiveComplaintForStatus(null)}
        complaint={activeComplaintForStatus}
        onUpdate={handleStatusUpdate}
        userRole="STAFF"
      />

      <FlagReviewModal
        isOpen={!!activeComplaintForFlag}
        onClose={() => setActiveComplaintForFlag(null)}
        complaintReference={activeComplaintForFlag?.reference || ''}
        onFlag={handleFlagReview}
      />
    </div>
  );
};
