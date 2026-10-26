import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { ComplaintItem } from '../../../../shared/types';
import { Sliders, AlertCircle } from 'lucide-react';

interface ScoreOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  complaint: ComplaintItem;
  onOverride: (scores: { priority?: number; urgency?: number; feasibility?: number; reason: string }) => Promise<void>;
}

export const ScoreOverrideModal: React.FC<ScoreOverrideModalProps> = ({
  isOpen,
  onClose,
  complaint,
  onOverride,
}) => {
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
      description={`Adjust evaluation metrics for ${complaint.reference}. Overrides will be audited.`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
            {error}
          </div>
        )}

        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
          <div className="text-slate-500 font-medium">Original Automated Scores:</div>
          <div className="flex gap-4 text-slate-700">
            <span>Priority: <b>{complaint.rawPriority.toFixed(1)}</b></span>
            <span>Urgency: <b>{complaint.rawUrgency.toFixed(1)}</b></span>
            <span>Feasibility: <b>{complaint.rawFeasibility.toFixed(1)}</b></span>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
              <span>Priority Score (45% weight)</span>
              <span className="text-civic-700 font-mono font-bold">{priority.toFixed(1)} / 10</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              step="0.1"
              value={priority}
              onChange={(e) => setPriority(parseFloat(e.target.value))}
              className="w-full accent-civic-600"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
              <span>Urgency Score (40% weight)</span>
              <span className="text-civic-700 font-mono font-bold">{urgency.toFixed(1)} / 10</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              step="0.1"
              value={urgency}
              onChange={(e) => setUrgency(parseFloat(e.target.value))}
              className="w-full accent-civic-600"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
              <span>Feasibility Score (Provisional)</span>
              <span className="text-civic-700 font-mono font-bold">{feasibility.toFixed(1)} / 10</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              step="0.1"
              value={feasibility}
              onChange={(e) => setFeasibility(parseFloat(e.target.value))}
              className="w-full accent-civic-600"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Mandatory Override Reason <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., School bus route; elevated priority due to high pedestrian vulnerability..."
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
            className="px-4 py-1.5 text-xs font-semibold text-white bg-civic-600 hover:bg-civic-700 rounded-lg shadow-sm disabled:opacity-50 transition-colors flex items-center gap-1.5"
          >
            <Sliders className="w-3.5 h-3.5" />
            {loading ? 'Saving...' : 'Apply Override'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
