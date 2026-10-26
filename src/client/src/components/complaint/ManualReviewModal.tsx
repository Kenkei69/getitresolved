import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { ComplaintItem, CategorySummary, DepartmentSummary } from '../../../../shared/types';
import { api } from '../../services/api';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface ManualReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  complaint: ComplaintItem;
  onDecision: (categoryId: string, departmentId: string, notes: string) => Promise<void>;
}

export const ManualReviewModal: React.FC<ManualReviewModalProps> = ({
  isOpen,
  onClose,
  complaint,
  onDecision,
}) => {
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [departments, setDepartments] = useState<DepartmentSummary[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(complaint.categoryId || '');
  const [selectedDepartment, setSelectedDepartment] = useState(complaint.departmentId || '');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      Promise.all([api.getCategories(), api.getDepartments()])
        .then(([cats, depts]) => {
          setCategories(cats);
          setDepartments(depts);
          if (!selectedCategory && cats.length > 0) setSelectedCategory(cats[0].id);
          if (!selectedDepartment && depts.length > 0) setSelectedDepartment(depts[0].id);
        })
        .catch(console.error);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim() || notes.trim().length < 5) {
      setError('Please provide an administrative review note (at least 5 characters).');
      return;
    }

    try {
      setLoading(true);
      await onDecision(selectedCategory, selectedDepartment, notes);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit review decision.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manual Administrative Triage"
      description={`Review and assign complaint ${complaint.reference}`}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
            {error}
          </div>
        )}

        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
          <div className="font-semibold text-slate-800">{complaint.title}</div>
          <div className="text-slate-600 line-clamp-2">{complaint.description}</div>
          <div className="text-slate-500 font-mono text-[11px] pt-1">
            Service Area: {complaint.serviceArea.name} &bull; Address: {complaint.address}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Correct Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white focus:border-civic-500 focus:ring-1 focus:ring-civic-500"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Assign Responsible Department
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white focus:border-civic-500 focus:ring-1 focus:ring-civic-500"
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Administrative Rationale / Triage Note <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Document reasons for department routing decision (recorded permanently in audit history)..."
            className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:border-civic-500 focus:ring-1 focus:ring-civic-500"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm disabled:opacity-50 transition-colors flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            {loading ? 'Approving...' : 'Approve & Assign Complaint'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
