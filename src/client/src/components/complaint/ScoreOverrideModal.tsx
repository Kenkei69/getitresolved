import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { ComplaintItem } from '../../../../shared/types';
import { Sliders, AlertCircle } from 'lucide-react';
import { FormLabel, FormHelp } from '../common/FormField';
import { Button } from '../common/Button';

interface ScoreOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  complaint: ComplaintItem | null;
  onOverride: (scores: { priority?: number; urgency?: number; feasibility?: number; reason: string }) => Promise<void>;
}

export const ScoreOverrideModal: React.FC<ScoreOverrideModalProps> = ({
  isOpen,
  onClose,
  complaint,
  onOverride,
}) => {
  if (!complaint || !isOpen) return null;

  const [priority, setPriority] = useState<number>(complaint.scores.effectivePriority);
  const [urgency, setUrgency] = useState<number>(complaint.scores.effectiveUrgency);
  const [feasibility, setFeasibility] = useState<number>(complaint.scores.effectiveFeasibility);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || reason.trim().length < 10) {
      setError('A justification note with at least 10 characters is required for score overrides.');
      return;
    }

    try {
      setLoading(true);
      await onOverride({
        priority: Number(priority),
        urgency: Number(urgency),
        feasibility: Number(feasibility),
        reason,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to apply score override.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Override Automated Impact Scores"
      description={`Adjust evaluation metrics for ${complaint.reference}. Overrides are logged in the immutable audit record.`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs sm:text-sm text-red-800" role="alert">
            {error}
          </div>
        )}

        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1">
          <div className="text-slate-500 font-medium">Original Automated Baseline Scores:</div>
          <div className="flex gap-4 text-slate-700">
            <span>Priority: <b>{complaint.rawPriority.toFixed(1)}</b></span>
            <span>Urgency: <b>{complaint.rawUrgency.toFixed(1)}</b></span>
            <span>Feasibility: <b>{complaint.rawFeasibility.toFixed(1)}</b></span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
              <span>Priority Score (45% Core Weight)</span>
              <span className="text-civic-700 font-mono font-bold">{priority.toFixed(1)} / 10.0</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              step="0.1"
              value={priority}
              onChange={(e) => setPriority(parseFloat(e.target.value))}
              className="w-full accent-civic-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
              <span>Urgency Score (40% Core Weight)</span>
              <span className="text-civic-700 font-mono font-bold">{urgency.toFixed(1)} / 10.0</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              step="0.1"
              value={urgency}
              onChange={(e) => setUrgency(parseFloat(e.target.value))}
              className="w-full accent-civic-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
              <span>Feasibility Score (Provisional Assessment)</span>
              <span className="text-civic-700 font-mono font-bold">{feasibility.toFixed(1)} / 10.0</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              step="0.1"
              value={feasibility}
              onChange={(e) => setFeasibility(parseFloat(e.target.value))}
              className="w-full accent-civic-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        <div>
          <FormLabel htmlFor="override-reason" required>
            Mandatory Justification Reason
          </FormLabel>
          <textarea
            id="override-reason"
            required
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., School bus route; elevated priority due to high pedestrian vulnerability..."
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
            icon={<Sliders className="w-4 h-4" />}
          >
            Apply Score Override
          </Button>
        </div>
      </form>
    </Modal>
  );
};
