import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ComplaintItem, DashboardStats } from '../../../shared/types';
import { ComplaintTable } from '../components/complaint/ComplaintTable';
import { FilterBar } from '../components/complaint/FilterBar';
import { StatusUpdateModal } from '../components/complaint/StatusUpdateModal';
import { ManualReviewModal } from '../components/complaint/ManualReviewModal';
import { ScoreOverrideModal } from '../components/complaint/ScoreOverrideModal';
import {
  ShieldAlert,
  Building2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  Flame,
  ArrowRight,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [filters, setFilters] = useState<any>({ page: 1, limit: 15, sortBy: 'coreScore', sortOrder: 'desc' });
  const [loading, setLoading] = useState(true);

  // Modals state
  const [activeComplaintForStatus, setActiveComplaintForStatus] = useState<ComplaintItem | null>(null);
  const [activeComplaintForReview, setActiveComplaintForReview] = useState<ComplaintItem | null>(null);
  const [activeComplaintForOverride, setActiveComplaintForOverride] = useState<ComplaintItem | null>(null);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [statsData, listData] = await Promise.all([
        api.getDashboardStats(),
        api.listComplaints(filters),
      ]);
      setStats(statsData);
      setComplaints(listData.items);
      setPagination(listData.pagination);
    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [filters]);

  const handleStatusUpdate = async (toStatus: any, note: string, isCitizenVisible: boolean, explanation?: string) => {
    if (!activeComplaintForStatus) return;
    await api.updateStatus(activeComplaintForStatus.id, { toStatus, note, isCitizenVisible, explanation });
    await fetchAdminData();
  };

  const handleManualReviewDecision = async (categoryId: string, departmentId: string, notes: string) => {
    if (!activeComplaintForReview) return;
    await api.submitManualReviewDecision(activeComplaintForReview.id, {
      categoryId,
      departmentId,
      reviewDecision: 'APPROVED',
      notes,
    });
    await fetchAdminData();
  };

  const handleScoreOverride = async (scores: any) => {
    if (!activeComplaintForOverride) return;
    await api.overrideScores(activeComplaintForOverride.id, scores);
    await fetchAdminData();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Municipal Administration</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            System overview, manual review triage, and department oversight.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/manual-review"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-sm transition-colors"
          >
            <ShieldAlert className="w-4 h-4" />
            Manual Review Queue ({stats?.manualReviewRequired ?? 0})
          </Link>
          <Link
            to="/admin/staff"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors shadow-sm"
          >
            <Users className="w-4 h-4" />
            Manage Staff
          </Link>
        </div>
      </div>

      {/* System Key Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-medium text-slate-500">Total System</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{stats?.totalComplaints ?? 0}</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-medium text-slate-500">Active / Open</div>
          <div className="text-xl font-bold text-amber-600 mt-1">{stats?.openComplaints ?? 0}</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-medium text-slate-500">In Progress</div>
          <div className="text-xl font-bold text-indigo-600 mt-1">{stats?.inProgressComplaints ?? 0}</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-medium text-slate-500">Resolved</div>
          <div className="text-xl font-bold text-emerald-600 mt-1">{stats?.resolvedComplaints ?? 0}</div>
        </div>

        <div className="bg-purple-50 p-3.5 rounded-xl border border-purple-200 shadow-sm">
          <div className="text-[11px] font-semibold text-purple-900">Review Required</div>
          <div className="text-xl font-bold text-purple-700 mt-1">{stats?.manualReviewRequired ?? 0}</div>
        </div>

        <div className="bg-red-50 p-3.5 rounded-xl border border-red-200 shadow-sm">
          <div className="text-[11px] font-semibold text-red-900">Core Score &gt; 7.0</div>
          <div className="text-xl font-bold text-red-700 mt-1">{stats?.highPriorityCount ?? 0}</div>
        </div>
      </div>

      {/* Department Breakdown Table */}
      {stats?.departmentStats && stats.departmentStats.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-civic-600" />
              Department Caseload Distribution
            </h2>
            <span className="text-xs text-slate-400">Real database operational counts</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {stats.departmentStats.map((d) => (
              <div key={d.departmentId} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1">
                <div className="font-semibold text-xs text-slate-900 line-clamp-1">{d.departmentName}</div>
                <div className="text-lg font-bold text-slate-800">{d.total} total</div>
                <div className="text-[11px] text-slate-500 flex justify-between">
                  <span>{d.inProgress} active</span>
                  <span>{d.resolved} closed</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Complaints Queue Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">All Municipal Complaints</h2>
            <p className="text-xs text-slate-500">
              Filter by department, category, star criteria, or sort by multi-factor core impact score.
            </p>
          </div>
          <span className="text-xs text-slate-500">
            {pagination.total} matching complaints
          </span>
        </div>

        <FilterBar
          filters={filters}
          onChange={(newF) => setFilters(newF)}
          showDepartmentFilter={true}
          showReviewFilter={true}
        />

        {loading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-xs text-slate-400">
            Loading municipal queue...
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
          />
        )}
      </div>

      {/* Modals */}
      {activeComplaintForStatus && (
        <StatusUpdateModal
          isOpen={!!activeComplaintForStatus}
          onClose={() => setActiveComplaintForStatus(null)}
          complaint={activeComplaintForStatus}
          onUpdate={handleStatusUpdate}
          userRole="ADMIN"
        />
      )}

      {activeComplaintForReview && (
        <ManualReviewModal
          isOpen={!!activeComplaintForReview}
          onClose={() => setActiveComplaintForReview(null)}
          complaint={activeComplaintForReview}
          onDecision={handleManualReviewDecision}
        />
      )}

      {activeComplaintForOverride && (
        <ScoreOverrideModal
          isOpen={!!activeComplaintForOverride}
          onClose={() => setActiveComplaintForOverride(null)}
          complaint={activeComplaintForOverride}
          onOverride={handleScoreOverride}
        />
      )}
    </div>
  );
};
