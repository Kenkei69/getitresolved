import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { AlertTriangle } from 'lucide-react';
import { FormLabel, FormHelp } from '../common/FormField';
import { Button } from '../common/Button';

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
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs sm:text-sm text-red-800" role="alert">
            {error}
          </div>
        )}

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs sm:text-sm text-amber-900 flex items-start gap-2.5">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
          <span>
            Use this action if this complaint is incorrectly routed to your department, or if resolution requires inter-departmental coordination.
          </span>
        </div>

        <div>
          <FormLabel htmlFor="flag-reason" required>
            Reason for Review
          </FormLabel>
          <textarea
            id="flag-reason"
            required
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., Issue is live electrical wiring near a water main, belongs to Electrical Department..."
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
            className="bg-amber-600 hover:bg-amber-700"
          >
            Flag for Review
          </Button>
        </div>
      </form>
    </Modal>
  );
};
