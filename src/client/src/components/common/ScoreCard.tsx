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
    <div className={`bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Core Impact Score
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {scores.coreScore.toFixed(1)}
            </span>
            <span className="text-sm text-slate-500 font-medium">/ 10.0</span>
            {scores.hasOverrides && (
              <span
                className="ml-2 inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200"
                title="Includes administrative score overrides with logged justification"
              >
                Manual Override
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Weighted: 45% Priority + 40% Urgency + 15% Duration
          </p>
        </div>

        <div className="sm:text-right">
          <span className="text-xs text-slate-500 font-medium block mb-1.5">
            High-Threshold Stars (&gt; 7.0)
          </span>
          <StarBadge stars={scores.stars} showLabels={true} />
        </div>
      </div>

      {showBreakdown && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-sm">
          {/* Priority */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div className="text-slate-600 font-medium text-xs flex items-center justify-between">
              <span>Priority (45%)</span>
              {scores.stars.redPriority && (
                <span className="text-priorityRed font-bold text-sm" aria-label="Red star awarded">★</span>
              )}
            </div>
            <div className="text-base font-bold text-slate-900 mt-1">
              {scores.effectivePriority.toFixed(1)}
              <span className="text-xs font-normal text-slate-500"> / 10</span>
            </div>
            <span className="text-[11px] text-slate-500 block mt-0.5">Civic disruption</span>
          </div>

          {/* Urgency */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div className="text-slate-600 font-medium text-xs flex items-center justify-between">
              <span>Urgency (40%)</span>
              {scores.stars.orangeUrgency && (
                <span className="text-urgencyOrange font-bold text-sm" aria-label="Orange star awarded">★</span>
              )}
            </div>
            <div className="text-base font-bold text-slate-900 mt-1">
              {scores.effectiveUrgency.toFixed(1)}
              <span className="text-xs font-normal text-slate-500"> / 10</span>
            </div>
            <span className="text-[11px] text-slate-500 block mt-0.5">Safety / hazard risk</span>
          </div>

          {/* Duration */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div className="text-slate-600 font-medium text-xs flex items-center justify-between">
              <span>Duration (15%)</span>
              {scores.stars.pinkDuration && (
                <span className="text-durationPink font-bold text-sm" aria-label="Pink star awarded">★</span>
              )}
            </div>
            <div className="text-base font-bold text-slate-900 mt-1">
              {scores.durationScore.toFixed(0)}
              <span className="text-xs font-normal text-slate-500"> ({scores.unresolvedAgeDays}d)</span>
            </div>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              floor(days / 3), star at 24d
            </span>
          </div>

          {/* Feasibility */}
          <div
            className="bg-slate-50 p-3 rounded-xl border border-slate-100"
            title="Provisional assessment of resolution ease. Excluded from core score so complex issues are not deprioritized."
          >
            <div className="text-slate-600 font-medium text-xs flex items-center justify-between">
              <span>Feasibility</span>
              {scores.stars.greenFeasibility && (
                <span className="text-feasibilityGreen font-bold text-sm" aria-label="Green star awarded">★</span>
              )}
            </div>
            <div className="text-base font-bold text-slate-900 mt-1">
              {scores.effectiveFeasibility.toFixed(1)}
              <span className="text-xs font-normal text-slate-500"> / 10</span>
            </div>
            <span className="text-[11px] text-amber-700 font-medium block mt-0.5">
              Provisional (excluded)
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
