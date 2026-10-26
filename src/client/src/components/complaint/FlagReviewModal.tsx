import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { AlertTriangle } from 'lucide-react';

interface FlagReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  complaintReference: string;
  onFlag: (reason: string) => Promise<void>;
}

export const FlagReviewModal: React.FC<FlagReviewModalProps> = ({
  isOpen,
  onClose,
  complaintReference,
  onFlag,
}) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim().length < 10) {
      setError('Please provide a reason with at least 10 characters.');
      return;
    }

    try {
      setLoading(true);
      await onFlag(reason);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to flag complaint.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Flag for Administrator Review"
      description={`Send complaint ${complaintReference} to the central manual triage queue.`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
            {error}
          </div>
        )}

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            Use this action if this complaint is incorrectly assigned to your department, or if the scope crosses multiple municipal jurisdictions.
          </span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Reason for Review <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., Issue is live electrical cabling near water main, belongs to Electrical Department..."
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
            className="px-4 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm disabled:opacity-50 transition-colors"
          >
            {loading ? 'Flagging...' : 'Flag for Review'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
