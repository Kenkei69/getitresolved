import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { DepartmentSummary } from '../../../shared/types';
import { Users, Building2, CheckCircle2, AlertCircle } from 'lucide-react';

export const AdminStaffPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<DepartmentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersData, deptsData] = await Promise.all([
        api.getUsers(),
        api.getDepartments(),
      ]);
      setUsers(usersData);
      setDepartments(deptsData);
    } catch (err) {
      console.error('Failed to load staff management data:', err);
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
      setMessage('Staff department assignment updated successfully.');
      setTimeout(() => setMessage(null), 3000);
      await fetchData();
    } catch (err: any) {
      alert(`Assignment failed: ${err.message}`);
    } finally {
      setSavingId(null);
    }
  };

  const staffMembers = users.filter((u) => u.role === 'STAFF');

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Staff & Department Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Assign municipal staff to specific operational departments and queues.
          </p>
        </div>
      </div>

      {message && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-xs text-slate-400">
          Loading staff directory...
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-civic-600" />
              Department Staff Accounts ({staffMembers.length})
            </h2>
            <span className="text-xs text-slate-400">Citizens cannot be assigned to departments</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th scope="col" className="py-3 px-6">Staff Member</th>
                  <th scope="col" className="py-3 px-6">Email Address</th>
                  <th scope="col" className="py-3 px-6">Assigned Department</th>
                  <th scope="col" className="py-3 px-6 text-right">Reassign Department</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffMembers.map((staff) => (
                  <tr key={staff.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-6 font-semibold text-slate-900">{staff.name}</td>
                    <td className="py-3 px-6 font-mono text-slate-500">{staff.email}</td>
                    <td className="py-3 px-6">
                      {staff.department ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                          <Building2 className="w-3 h-3 text-blue-600" />
                          {staff.department.name}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 px-6 text-right">
                      <select
                        disabled={savingId === staff.id}
                        value={staff.departmentId || ''}
                        onChange={(e) => handleDepartmentChange(staff.id, e.target.value || null)}
                        className="text-xs rounded-lg border border-slate-300 p-1.5 bg-white focus:border-civic-500 disabled:opacity-50"
                      >
                        <option value="">Unassigned</option>
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
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
