import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { ComplaintItem, ComplaintStatus } from '../../../../shared/types';
import { STATUS_TRANSITIONS } from '../../../../shared/constants';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { FormLabel, FormHelp } from '../common/FormField';
import { Button } from '../common/Button';

interface StatusUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  complaint: ComplaintItem | null;
  onUpdate: (toStatus: ComplaintStatus, note: string, isCitizenVisible: boolean, explanation?: string) => Promise<void>;
  userRole?: string;
}

export const StatusUpdateModal: React.FC<StatusUpdateModalProps> = ({
  isOpen,
  onClose,
  complaint,
  onUpdate,
  userRole,
}) => {
  if (!complaint || !isOpen) return null;

  const allowedTransitions = STATUS_TRANSITIONS[complaint.status] || [];

  // Filter out reopening if not admin
  const availableStatuses = allowedTransitions.filter((s) => {
    if (complaint.status === 'RESOLVED' && s === 'ASSIGNED') {
      return userRole === 'ADMIN';
    }
    return true;
  }) as ComplaintStatus[];

  const [toStatus, setToStatus] = useState<ComplaintStatus>(availableStatuses[0] || 'IN_PROGRESS');
  const [note, setNote] = useState('');
  const [explanation, setExplanation] = useState('');
  const [isCitizenVisible, setIsCitizenVisible] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (toStatus === 'RESOLVED') {
      if (!note.trim() || note.trim().length < 5) {
        setError('A detailed resolution note (at least 5 characters) is required to close this complaint.');
        return;
      }
    }

    if (
      (complaint.status === 'IN_PROGRESS' && toStatus === 'ASSIGNED') ||
      (complaint.status === 'RESOLVED' && toStatus === 'ASSIGNED')
    ) {
      if (!explanation.trim() || explanation.trim().length < 5) {
        setError('An administrative explanation is required for this status change.');
        return;
      }
    }

    try {
      setLoading(true);
      await onUpdate(toStatus, note, isCitizenVisible, explanation);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update status.');
    } finally {
      setLoading(false);
    }
  };

  const isReopening = complaint.status === 'RESOLVED' && toStatus === 'ASSIGNED';
  const isReverting = complaint.status === 'IN_PROGRESS' && toStatus === 'ASSIGNED';
  const isResolving = toStatus === 'RESOLVED';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Update Complaint Status"
      description={`Reference: ${complaint.reference} — Current status: ${complaint.status}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs sm:text-sm text-red-800 flex items-start gap-2.5" role="alert">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <FormLabel required>Select Target Status</FormLabel>
          <div className="grid grid-cols-2 gap-2 mt-1">
            {availableStatuses.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setToStatus(s)}
                className={`py-2.5 px-3 text-xs sm:text-sm font-semibold rounded-xl border text-center transition-all min-h-[42px] ${
                  toStatus === s
                    ? 'border-civic-600 bg-civic-50 text-civic-900 ring-2 ring-civic-500/20'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Resolution note */}
        {isResolving && (
          <div>
            <FormLabel htmlFor="resolution-note" required>
              Citizen Resolution Note
            </FormLabel>
            <textarea
              id="resolution-note"
              required
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Describe the completed work (e.g., Replaced 6-inch water clamp, patched 2x2 asphalt section)..."
              className="w-full text-sm rounded-xl border border-slate-300 p-3 focus:outline-none focus:ring-2 focus:ring-civic-100 focus:border-civic-500"
            />
            <FormHelp>This note will be visible to the citizen and recorded in the permanent audit history.</FormHelp>
          </div>
        )}

        {/* Explanation for Reopening or Reverting */}
        {(isReopening || isReverting) && (
          <div>
            <FormLabel htmlFor="revert-explanation" required>
              Administrative Justification Reason
            </FormLabel>
            <textarea
              id="revert-explanation"
              required
              rows={3}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="State clear operational reason for reversing status..."
              className="w-full text-sm rounded-xl border border-slate-300 p-3 focus:outline-none focus:ring-2 focus:ring-civic-100 focus:border-civic-500"
            />
            <FormHelp>Explain why this complaint is being returned to Assigned status.</FormHelp>
          </div>
        )}

        {/* Standard progress note */}
        {!isResolving && !isReopening && !isReverting && (
          <div>
            <FormLabel htmlFor="progress-note">
              Progress Note (Optional)
            </FormLabel>
            <textarea
              id="progress-note"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g., Work crew dispatched; parts on order..."
              className="w-full text-sm rounded-xl border border-slate-300 p-3 focus:outline-none focus:ring-2 focus:ring-civic-100 focus:border-civic-500"
            />
          </div>
        )}

        {/* Citizen visibility toggle */}
        <div className="flex items-center gap-2.5 pt-1">
          <input
            type="checkbox"
            id="isCitizenVisible"
            checked={isCitizenVisible}
            onChange={(e) => setIsCitizenVisible(e.target.checked)}
            className="rounded border-slate-300 text-civic-600 focus:ring-civic-500 h-4 w-4"
          />
          <label htmlFor="isCitizenVisible" className="text-xs sm:text-sm text-slate-700 select-none cursor-pointer">
            Make this update visible on the citizen tracking timeline
          </label>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button variant="secondary" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="md" type="submit" loading={loading}>
            Confirm Status Change
          </Button>
        </div>
      </form>
    </Modal>
  );
};
