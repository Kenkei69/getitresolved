import React from 'react';
import { ScoreStars } from '../../../../shared/types';

interface StarBadgeProps {
  stars: ScoreStars;
  showLabels?: boolean;
  size?: 'sm' | 'md';
}

export const StarBadge: React.FC<StarBadgeProps> = ({ stars, showLabels = false, size = 'md' }) => {
  const hasAnyStar = stars.redPriority || stars.pinkDuration || stars.orangeUrgency || stars.greenFeasibility;

  if (!hasAnyStar) {
    return (
      <span className="text-xs text-slate-400 font-medium" title="No metrics exceed threshold (> 7.0)">
        No high-threshold stars (&le; 7.0)
      </span>
    );
  }

  const starSizeClass = size === 'sm' ? 'w-3.5 h-3.5 text-xs' : 'w-4 h-4 text-sm';

  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Impact Assessment Star Indicators">
      {stars.redPriority && (
        <span
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800 border border-red-200"
          title="Priority > 7.0: High public impact and essential service disruption"
          aria-label="Red Star: Priority strictly greater than 7"
        >
          <span className={`text-priorityRed ${starSizeClass}`} aria-hidden="true">★</span>
          {showLabels ? 'Priority > 7' : 'Priority'}
        </span>
      )}

      {stars.pinkDuration && (
        <span
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-semibold bg-pink-100 text-pink-800 border border-pink-200"
          title="Duration > 7.0: Unresolved for over 21 days"
          aria-label="Pink Star: Duration strictly greater than 7"
        >
          <span className={`text-durationPink ${starSizeClass}`} aria-hidden="true">★</span>
          {showLabels ? 'Age > 21d' : 'Duration'}
        </span>
      )}

      {stars.orangeUrgency && (
        <span
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-200"
          title="Urgency > 7.0: Immediate safety risk or rapid deterioration"
          aria-label="Orange Star: Urgency strictly greater than 7"
        >
          <span className={`text-urgencyOrange ${starSizeClass}`} aria-hidden="true">★</span>
          {showLabels ? 'Urgency > 7' : 'Urgency'}
        </span>
      )}

      {stars.greenFeasibility && (
        <span
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200"
          title="Feasibility > 7.0: Provisional assessment indicates relatively straightforward resolution"
          aria-label="Green Star: Feasibility strictly greater than 7"
        >
          <span className={`text-feasibilityGreen ${starSizeClass}`} aria-hidden="true">★</span>
          {showLabels ? 'Feasible > 7' : 'Feasibility'}
        </span>
      )}
    </div>
  );
};
