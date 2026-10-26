import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { DepartmentSummary } from '../../../shared/types';
import { Users, Building2, CheckCircle2, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Alert } from '../components/common/Alert';

export const AdminStaffPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<DepartmentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersData, deptsData] = await Promise.all([
        api.getUsers(),
        api.getDepartments(),
      ]);
      setUsers(usersData);
      setDepartments(deptsData);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to load staff management directory.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDepartmentChange = async (userId: string, newDeptId: string | null) => {
    try {
      setSavingId(userId);
      await api.assignStaffDepartment({
        userId,
        departmentId: newDeptId || null,
      });
      setNotification({ type: 'success', message: 'Staff department assignment updated successfully.' });
      setTimeout(() => setNotification(null), 4000);
      await fetchData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Assignment update failed.' });
    } finally {
      setSavingId(null);
    }
  };

  const staffMembers = users.filter((u) => u.role === 'STAFF');

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
              Staff & Department Management
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Assign municipal personnel to operational queues and active dispatch divisions.
            </p>
          </div>
        </div>
      </div>

      {notification && (
        <Alert
          variant={notification.type === 'success' ? 'success' : 'error'}
          onDismiss={() => setNotification(null)}
        >
          {notification.message}
        </Alert>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center text-sm text-slate-500 space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-civic-600 border-t-transparent animate-spin mx-auto" />
          <p>Loading staff directory...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-civic-600" aria-hidden="true" />
              <span>Department Staff Accounts ({staffMembers.length})</span>
            </h2>
            <span className="text-xs text-slate-500">Citizen accounts are excluded from department assignment</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-xs">
                  <th scope="col" className="py-3.5 px-6">Staff Member</th>
                  <th scope="col" className="py-3.5 px-6">Email Address</th>
                  <th scope="col" className="py-3.5 px-6">Current Department</th>
                  <th scope="col" className="py-3.5 px-6 text-right">Reassign Department</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffMembers.map((staff) => (
                  <tr key={staff.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-6 font-semibold text-slate-900">{staff.name}</td>
                    <td className="py-4 px-6 font-mono text-xs text-slate-500">{staff.email}</td>
                    <td className="py-4 px-6">
                      {staff.department ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-900 border border-blue-200">
                          <Building2 className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />
                          <span>{staff.department.name}</span>
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="inline-flex items-center gap-2">
                        {savingId === staff.id && (
                          <Loader2 className="w-4 h-4 animate-spin text-civic-600" aria-hidden="true" />
                        )}
                        <label htmlFor={`staff-dept-${staff.id}`} className="sr-only">
                          Assign department for {staff.name}
                        </label>
                        <select
                          id={`staff-dept-${staff.id}`}
                          disabled={savingId === staff.id}
                          value={staff.departmentId || ''}
                          onChange={(e) => handleDepartmentChange(staff.id, e.target.value || null)}
                          className="text-xs rounded-xl border border-slate-300 p-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-civic-100 focus:border-civic-500 disabled:opacity-50"
                        >
                          <option value="">Unassigned</option>
                          {departments.map((dept) => (
                            <option key={dept.id} value={dept.id}>
                              {dept.name}
                            </option>
                          ))}
                        </select>
                      </div>
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
