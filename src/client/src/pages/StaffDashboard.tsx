import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ComplaintItem, DashboardStats } from '../../../shared/types';
import { ComplaintTable } from '../components/complaint/ComplaintTable';
import { FilterBar } from '../components/complaint/FilterBar';
import { StatusUpdateModal } from '../components/complaint/StatusUpdateModal';
import { FlagReviewModal } from '../components/complaint/FlagReviewModal';
import { Building2, Clock, AlertCircle, CheckCircle2, HardHat } from 'lucide-react';

export const StaffDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [filters, setFilters] = useState<any>({ page: 1, limit: 15, sortBy: 'coreScore', sortOrder: 'desc' });
  const [loading, setLoading] = useState(true);

  // Active modals
  const [activeComplaintForStatus, setActiveComplaintForStatus] = useState<ComplaintItem | null>(null);
  const [activeComplaintForFlag, setActiveComplaintForFlag] = useState<ComplaintItem | null>(null);

  const fetchStaffData = async () => {
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
      console.error('Failed to load staff queue data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffData();
  }, [filters]);

  const handleStatusUpdate = async (toStatus: any, note: string, isCitizenVisible: boolean, explanation?: string) => {
    if (!activeComplaintForStatus) return;
    await api.updateStatus(activeComplaintForStatus.id, { toStatus, note, isCitizenVisible, explanation });
    await fetchStaffData();
  };

  const handleFlagReview = async (reason: string) => {
    if (!activeComplaintForFlag) return;
    await api.flagForReview(activeComplaintForFlag.id, reason);
    await fetchStaffData();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Department Operations Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
            <HardHat className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                Department Operations Queue
              </span>
              <span className="text-xs text-slate-500">Staff: {user?.name}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              {user?.department?.name || 'Department Staff Queue'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {user?.department?.description || 'Municipal Operations Division'}
            </p>
          </div>
        </div>
      </div>

      {/* Department Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Total Department Queue</span>
            <Building2 className="w-4 h-4 text-civic-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats?.totalComplaints ?? 0}</div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Total assigned complaints</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Awaiting Dispatch</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats?.openComplaints ?? 0}</div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Assigned, not started</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">In Progress</span>
            <AlertCircle className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats?.inProgressComplaints ?? 0}</div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Crews actively on-site</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Resolved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats?.resolvedComplaints ?? 0}</div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Successfully addressed</span>
        </div>
      </div>

      {/* Queue Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Assigned Complaints Queue</h2>
            <p className="text-xs text-slate-500">
              Ranked automatically by Core Impact Score (Priority 45% + Urgency 40% + Duration 15%)
            </p>
          </div>
          <span className="text-xs text-slate-500">
            {pagination.total} complaints matching filters
          </span>
        </div>

        <FilterBar
          filters={filters}
          onChange={(newF) => setFilters(newF)}
          showDepartmentFilter={false}
          showReviewFilter={false}
        />

        {loading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-xs text-slate-400">
            Loading department queue...
          </div>
        ) : (
          <ComplaintTable
            complaints={complaints}
            pagination={pagination}
            onPageChange={(p) => setFilters({ ...filters, page: p })}
            showDepartmentCol={false}
            onOpenStatusModal={(c) => setActiveComplaintForStatus(c)}
            onOpenFlagModal={(c) => setActiveComplaintForFlag(c)}
            userRole={user?.role}
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
          userRole={user?.role}
        />
      )}

      {activeComplaintForFlag && (
        <FlagReviewModal
          isOpen={!!activeComplaintForFlag}
          onClose={() => setActiveComplaintForFlag(null)}
          complaintReference={activeComplaintForFlag.reference}
          onFlag={handleFlagReview}
        />
      )}
    </div>
  );
};
