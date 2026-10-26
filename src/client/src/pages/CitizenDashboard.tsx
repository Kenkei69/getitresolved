import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ComplaintItem, DashboardStats } from '../../../shared/types';
import { ComplaintTable } from '../components/complaint/ComplaintTable';
import { FilterBar } from '../components/complaint/FilterBar';
import { PlusCircle, FileText, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export const CitizenDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [filters, setFilters] = useState<any>({ page: 1, limit: 10, sortBy: 'coreScore', sortOrder: 'desc' });
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
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
      console.error('Failed to load citizen dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [filters]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Citizen Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Welcome back, <span className="font-semibold text-slate-700">{user?.name}</span>. Track your active reports below.
          </p>
        </div>

        <Link
          to="/submit"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-civic-600 hover:bg-civic-700 rounded-xl shadow-sm transition-colors self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          Report an Issue
        </Link>
      </div>

      {/* Real Statistics Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Total Submitted</span>
            <FileText className="w-4 h-4 text-civic-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats?.totalComplaints ?? 0}</div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Lifetime complaints filed</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Open / Assigned</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats?.openComplaints ?? 0}</div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Awaiting or assigned to team</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">In Progress</span>
            <AlertCircle className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats?.inProgressComplaints ?? 0}</div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Crews actively dispatched</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Resolved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats?.resolvedComplaints ?? 0}</div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Addressed and closed</span>
        </div>
      </div>

      {/* Complaints List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Your Submitted Complaints</h2>
          <span className="text-xs text-slate-500">
            {pagination.total} {pagination.total === 1 ? 'record' : 'records'}
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
            Loading your complaints...
          </div>
        ) : (
          <ComplaintTable
            complaints={complaints}
            pagination={pagination}
            onPageChange={(p) => setFilters({ ...filters, page: p })}
            showDepartmentCol={true}
            userRole={user?.role}
          />
        )}
      </div>
    </div>
  );
};
