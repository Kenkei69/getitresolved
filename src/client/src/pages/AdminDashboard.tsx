import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ComplaintItem, DashboardStats } from '../../../shared/types';
import { ComplaintTable } from '../components/complaint/ComplaintTable';
import { FilterBar } from '../components/complaint/FilterBar';
import { StatusUpdateModal } from '../components/complaint/StatusUpdateModal';
import { ManualReviewModal } from '../components/complaint/ManualReviewModal';
import { ScoreOverrideModal } from '../components/complaint/ScoreOverrideModal';
import { MetricCard } from '../components/common/MetricCard';
import { Alert } from '../components/common/Alert';
import {
  ShieldAlert,
  Building2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  ClipboardList,
  RefreshCw,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [filters, setFilters] = useState<any>({ page: 1, limit: 15, sortBy: 'coreScore', sortOrder: 'desc' });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals state
  const [activeComplaintForStatus, setActiveComplaintForStatus] = useState<ComplaintItem | null>(null);
  const [activeComplaintForReview, setActiveComplaintForReview] = useState<ComplaintItem | null>(null);
  const [activeComplaintForOverride, setActiveComplaintForOverride] = useState<ComplaintItem | null>(null);

  const latestRequestId = useRef(0);

  const fetchAdminData = async (isBackground = false) => {
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
        setError(err.message || 'Failed to load administrator dashboard data.');
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
    fetchAdminData(isBackground);
  }, [filters]);

  const handleStatusUpdate = async (toStatus: any, note: string, isCitizenVisible: boolean, explanation?: string) => {
    if (!activeComplaintForStatus) return;
    try {
      await api.updateStatus(activeComplaintForStatus.id, { toStatus, note, isCitizenVisible, explanation });
      setActionNotice({ type: 'success', message: 'Complaint status updated.' });
      setTimeout(() => setActionNotice(null), 4000);
      await fetchAdminData(true);
    } catch (err: any) {
      setActionNotice({ type: 'error', message: err.message || 'Failed to update status.' });
    }
  };

  const handleManualReviewDecision = async (categoryId: string, departmentId: string, notes: string) => {
    if (!activeComplaintForReview) return;
    try {
      await api.submitManualReviewDecision(activeComplaintForReview.id, {
        categoryId,
        departmentId,
        reviewDecision: 'APPROVED',
        notes,
      });
      setActionNotice({ type: 'success', message: 'Triage decision recorded and department assigned.' });
      setTimeout(() => setActionNotice(null), 4000);
      await fetchAdminData(true);
    } catch (err: any) {
      setActionNotice({ type: 'error', message: err.message || 'Failed to submit review decision.' });
    }
  };

  const handleScoreOverride = async (scores: any) => {
    if (!activeComplaintForOverride) return;
    try {
      await api.overrideScores(activeComplaintForOverride.id, scores);
      setActionNotice({ type: 'success', message: 'Impact scores overridden with mandatory audit reason.' });
      setTimeout(() => setActionNotice(null), 4000);
      await fetchAdminData(true);
    } catch (err: any) {
      setActionNotice({ type: 'error', message: err.message || 'Failed to override scores.' });
    }
  };

  const handleResetFilters = () => {
    setFilters({ page: 1, limit: 15, sortBy: 'coreScore', sortOrder: 'desc' });
  };

  const hasActiveFilters =
    !!filters.search ||
    !!filters.categoryId ||
    !!filters.serviceAreaId ||
    !!filters.departmentId ||
    !!filters.status ||
    !!filters.reviewState ||
    filters.starRed === 'true' ||
    filters.starPink === 'true' ||
    filters.starOrange === 'true' ||
    filters.starGreen === 'true' ||
    filters.sortBy !== 'coreScore';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Municipal Administration
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            System overview, manual review triage queue, department queues, and audit history.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {refreshing && (
            <span className="text-xs text-slate-400 flex items-center gap-1.5 animate-pulse mr-1">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Updating...
            </span>
          )}
          <Link
            to="/admin/manual-review"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs transition-colors min-h-[42px]"
          >
            <ShieldAlert className="w-4 h-4" aria-hidden="true" />
            <span>Manual Review ({stats?.manualReviewRequired ?? 0})</span>
          </Link>
          <Link
            to="/admin/staff"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors shadow-2xs min-h-[42px]"
          >
            <Users className="w-4 h-4 text-slate-500" aria-hidden="true" />
            <span>Staff Directory</span>
          </Link>
          <Link
            to="/admin/audit-logs"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors shadow-2xs min-h-[42px]"
          >
            <ClipboardList className="w-4 h-4 text-slate-500" aria-hidden="true" />
            <span>Audit Trail</span>
          </Link>
        </div>
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
          title="Admin Queue Error"
          action={{
            label: 'Retry Loading',
            onClick: () => fetchAdminData(false),
          }}
        >
          {error}
        </Alert>
      )}

      {/* Admin Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard
          label="Total Complaints"
          value={stats?.totalComplaints}
          loading={loading && !stats}
          description="All lifetime submissions"
          icon={<Building2 className="w-5 h-5 text-civic-600" aria-hidden="true" />}
        />
        <MetricCard
          label="Manual Review Needed"
          value={stats?.manualReviewRequired}
          loading={loading && !stats}
          description="Diverted / low confidence"
          icon={<ShieldAlert className="w-5 h-5 text-purple-600" aria-hidden="true" />}
        />
        <MetricCard
          label="Active / In Progress"
          value={stats?.inProgressComplaints}
          loading={loading && !stats}
          description="Under active handling"
          icon={<Clock className="w-5 h-5 text-amber-500" aria-hidden="true" />}
        />
        <MetricCard
          label="Resolved Issues"
          value={stats?.resolvedComplaints}
          loading={loading && !stats}
          description="Verified and closed"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" aria-hidden="true" />}
        />
      </div>

      {/* All Complaints Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">System Complaints Directory</h2>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
            {pagination.total} {pagination.total === 1 ? 'record' : 'records'}
          </span>
        </div>

        <FilterBar
          filters={filters}
          onChange={(newF) => setFilters(newF)}
          showDepartmentFilter={true}
          showReviewFilter={true}
        />

        {loading && !complaints.length ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-sm text-slate-500 space-y-2">
            <div className="w-8 h-8 rounded-full border-2 border-civic-600 border-t-transparent animate-spin mx-auto" />
            <p>Loading complaints...</p>
          </div>
        ) : (
          <ComplaintTable
            complaints={complaints}
            pagination={pagination}
            onPageChange={(p) => setFilters({ ...filters, page: p })}
            showDepartmentCol={true}
            onOpenStatusModal={(c) => setActiveComplaintForStatus(c)}
            onOpenReviewModal={(c) => setActiveComplaintForReview(c)}
            onOpenOverrideModal={(c) => setActiveComplaintForOverride(c)}
            userRole="ADMIN"
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
        userRole="ADMIN"
      />

      <ManualReviewModal
        isOpen={!!activeComplaintForReview}
        onClose={() => setActiveComplaintForReview(null)}
        complaint={activeComplaintForReview}
        onDecision={handleManualReviewDecision}
      />

      <ScoreOverrideModal
        isOpen={!!activeComplaintForOverride}
        onClose={() => setActiveComplaintForOverride(null)}
        complaint={activeComplaintForOverride}
        onOverride={handleScoreOverride}
      />
    </div>
  );
};
