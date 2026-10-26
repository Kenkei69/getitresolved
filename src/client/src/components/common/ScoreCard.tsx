import React from 'react';
import { ComplaintScoreDetails } from '../../../../shared/types';
import { StarBadge } from './StarBadge';

interface ScoreCardProps {
  scores: ComplaintScoreDetails;
  showBreakdown?: boolean;
  className?: string;
}

export const ScoreCard: React.FC<ScoreCardProps> = ({ scores, showBreakdown = true, className = '' }) => {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-4 shadow-sm ${className}`}>
      <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 mb-3">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Core Impact Score
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">
              {scores.coreScore.toFixed(1)}
            </span>
            <span className="text-xs text-slate-500 font-medium">/ 10.0</span>
            {scores.hasOverrides && (
              <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-amber-100 text-amber-800 border border-amber-200" title="Includes administrative human score overrides">
                Manual Override
              </span>
            )}
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs text-slate-500 font-medium block mb-1">Star Thresholds (&gt; 7.0)</span>
          <StarBadge stars={scores.stars} showLabels={false} />
        </div>
      </div>

      {showBreakdown && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
            <div className="text-slate-500 font-medium flex items-center justify-between">
              <span>Priority (45%)</span>
              {scores.stars.redPriority && <span className="text-priorityRed font-bold">★</span>}
            </div>
            <div className="text-sm font-bold text-slate-900 mt-0.5">
              {scores.effectivePriority.toFixed(1)}
              <span className="text-[11px] font-normal text-slate-500"> / 10</span>
            </div>
          </div>

          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
            <div className="text-slate-500 font-medium flex items-center justify-between">
              <span>Urgency (40%)</span>
              {scores.stars.orangeUrgency && <span className="text-urgencyOrange font-bold">★</span>}
            </div>
            <div className="text-sm font-bold text-slate-900 mt-0.5">
              {scores.effectiveUrgency.toFixed(1)}
              <span className="text-[11px] font-normal text-slate-500"> / 10</span>
            </div>
          </div>

          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
            <div className="text-slate-500 font-medium flex items-center justify-between">
              <span>Duration (15%)</span>
              {scores.stars.pinkDuration && <span className="text-durationPink font-bold">★</span>}
            </div>
            <div className="text-sm font-bold text-slate-900 mt-0.5">
              {scores.durationScore.toFixed(0)}
              <span className="text-[11px] font-normal text-slate-500"> ({scores.unresolvedAgeDays}d)</span>
            </div>
          </div>

          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100" title="Provisional estimate of resolution ease. Excluded from core score so hard problems are not deprioritized.">
            <div className="text-slate-500 font-medium flex items-center justify-between">
              <span>Feasibility</span>
              {scores.stars.greenFeasibility && <span className="text-feasibilityGreen font-bold">★</span>}
            </div>
            <div className="text-sm font-bold text-slate-900 mt-0.5">
              {scores.effectiveFeasibility.toFixed(1)}
              <span className="text-[10px] font-normal text-slate-400 block sm:inline sm:ml-1">(provisional)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
