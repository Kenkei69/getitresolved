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
        No star indicators (&le; 7.0)
      </span>
    );
  }

  const starSizeClass = size === 'sm' ? 'w-3.5 h-3.5 text-xs' : 'w-4 h-4 text-sm';

  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Objective Impact Assessment Star Indicators">
      {stars.redPriority && (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold bg-red-50 text-red-800 border border-red-200"
          title="Priority > 7.0: Major civic impact and utility/transit disruption"
          aria-label="Red Star: Priority assessment exceeds 7.0"
        >
          <span className={`text-priorityRed ${starSizeClass}`} aria-hidden="true">★</span>
          <span>{showLabels ? 'Priority > 7' : 'Priority'}</span>
        </span>
      )}

      {stars.pinkDuration && (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold bg-pink-50 text-pink-800 border border-pink-200"
          title="Duration > 7.0: Unresolved for at least 24 complete days under the floor(days/3) rule"
          aria-label="Pink Star: Duration exceeds 7.0 (at least 24 days)"
        >
          <span className={`text-durationPink ${starSizeClass}`} aria-hidden="true">★</span>
          <span>{showLabels ? 'Age ≥ 24d' : 'Duration'}</span>
        </span>
      )}

      {stars.orangeUrgency && (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold bg-orange-50 text-orange-800 border border-orange-200"
          title="Urgency > 7.0: Immediate safety risk or progressive deterioration"
          aria-label="Orange Star: Urgency assessment exceeds 7.0"
        >
          <span className={`text-urgencyOrange ${starSizeClass}`} aria-hidden="true">★</span>
          <span>{showLabels ? 'Urgency > 7' : 'Urgency'}</span>
        </span>
      )}

      {stars.greenFeasibility && (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200"
          title="Feasibility > 7.0: Provisional assessment indicates straightforward resolution"
          aria-label="Green Star: Provisional feasibility exceeds 7.0"
        >
          <span className={`text-feasibilityGreen ${starSizeClass}`} aria-hidden="true">★</span>
          <span>{showLabels ? 'Feasible > 7' : 'Feasibility'}</span>
        </span>
      )}
    </div>
  );
};
