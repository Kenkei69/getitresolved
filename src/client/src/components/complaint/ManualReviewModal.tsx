import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { ComplaintItem, CategorySummary, DepartmentSummary } from '../../../../shared/types';
import { api } from '../../services/api';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { FormLabel, FormHelp } from '../common/FormField';
import { Button } from '../common/Button';

interface ManualReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  complaint: ComplaintItem | null;
  onDecision: (categoryId: string, departmentId: string, notes: string) => Promise<void>;
}

export const ManualReviewModal: React.FC<ManualReviewModalProps> = ({
  isOpen,
  onClose,
  complaint,
  onDecision,
}) => {
  if (!complaint || !isOpen) return null;

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
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs sm:text-sm text-red-800" role="alert">
            {error}
          </div>
        )}

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm space-y-1">
          <div className="font-bold text-slate-900">{complaint.title}</div>
          <div className="text-slate-600 line-clamp-2 text-xs">{complaint.description}</div>
          <div className="text-slate-500 font-mono text-xs pt-1">
            Ward: {complaint.serviceArea.name} &bull; Address: {complaint.address}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FormLabel htmlFor="review-category" required>
              Select Verified Category
            </FormLabel>
            <select
              id="review-category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full text-sm rounded-xl border border-slate-300 p-2.5 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-civic-100 focus:border-civic-500"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <FormLabel htmlFor="review-dept" required>
              Assign Responsible Department
            </FormLabel>
            <select
              id="review-dept"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full text-sm rounded-xl border border-slate-300 p-2.5 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-civic-100 focus:border-civic-500"
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
          <FormLabel htmlFor="review-notes" required>
            Triage Justification Reason
          </FormLabel>
          <textarea
            id="review-notes"
            required
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Document reasons for department routing decision (permanently preserved in audit log)..."
            className="w-full text-sm rounded-xl border border-slate-300 p-3 focus:outline-none focus:ring-2 focus:ring-civic-100 focus:border-civic-500"
          />
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button variant="secondary" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={loading}
            className="bg-purple-600 hover:bg-purple-700"
            icon={<CheckCircle2 className="w-4 h-4" />}
          >
            Approve & Assign Complaint
          </Button>
        </div>
      </form>
    </Modal>
  );
};
