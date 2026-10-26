import { SCORING_CONFIG } from '../../shared/constants';
import { ComplaintScoreDetails, ScoreStars } from '../../shared/types';

export interface ScoreInputData {
  createdAt: Date;
  resolvedAt?: Date | null;
  priority: number;
  urgency: number;
  feasibility: number;
  overridePriority?: number | null;
  overrideUrgency?: number | null;
  overrideFeasibility?: number | null;
}

/**
 * Calculates unresolved age in whole days.
 * For resolved complaints, freezes age at resolvedAt timestamp.
 */
export function calculateAgeInDays(createdAt: Date, resolvedAt?: Date | null, now: Date = new Date()): number {
  const targetDate = resolvedAt ? new Date(resolvedAt) : now;
  const createdDate = new Date(createdAt);
  const diffMs = Math.max(0, targetDate.getTime() - createdDate.getTime());
  return Math.floor(diffMs / (24 * 60 * 60 * 1000));
}

/**
 * Calculates duration score: min(10, floor(unresolvedAgeInDays / 3))
 * 1 point per 3 days, capped at 10.
 */
export function calculateDurationScore(unresolvedAgeInDays: number): number {
  return Math.min(10, Math.max(0, Math.floor(unresolvedAgeInDays / SCORING_CONFIG.daysPerDurationPoint)));
}

/**
 * Evaluates colored star indicators:
 * Strictly greater than 7.0 threshold (score > 7.0)
 * Note: Exactly 7.0 does NOT trigger a star!
 */
export function evaluateStars(
  effectivePriority: number,
  durationScore: number,
  effectiveUrgency: number,
  effectiveFeasibility: number
): ScoreStars {
  return {
    redPriority: effectivePriority > SCORING_CONFIG.starThreshold,
    pinkDuration: durationScore > SCORING_CONFIG.starThreshold,
    orangeUrgency: effectiveUrgency > SCORING_CONFIG.starThreshold,
    greenFeasibility: effectiveFeasibility > SCORING_CONFIG.starThreshold,
  };
}

/**
 * Calculates overall core score:
 * round(0.45 * priority + 0.40 * urgency + 0.15 * durationScore, 1)
 */
export function calculateCoreScore(
  effectivePriority: number,
  effectiveUrgency: number,
  durationScore: number
): number {
  const raw =
    SCORING_CONFIG.weights.priority * effectivePriority +
    SCORING_CONFIG.weights.urgency * effectiveUrgency +
    SCORING_CONFIG.weights.duration * durationScore;
  return Math.round(raw * 10) / 10;
}

/**
 * Calculates full score details including effective overrides, duration, core score, and stars.
 */
export function computeComplaintScores(data: ScoreInputData, now: Date = new Date()): ComplaintScoreDetails {
  const unresolvedAgeDays = calculateAgeInDays(data.createdAt, data.resolvedAt, now);
  const durationScore = calculateDurationScore(unresolvedAgeDays);

  const effectivePriority =
    data.overridePriority !== null && data.overridePriority !== undefined
      ? data.overridePriority
      : data.priority;

  const effectiveUrgency =
    data.overrideUrgency !== null && data.overrideUrgency !== undefined
      ? data.overrideUrgency
      : data.urgency;

  const effectiveFeasibility =
    data.overrideFeasibility !== null && data.overrideFeasibility !== undefined
      ? data.overrideFeasibility
      : data.feasibility;

  const hasOverrides =
    (data.overridePriority !== null && data.overridePriority !== undefined) ||
    (data.overrideUrgency !== null && data.overrideUrgency !== undefined) ||
    (data.overrideFeasibility !== null && data.overrideFeasibility !== undefined);

  const coreScore = calculateCoreScore(effectivePriority, effectiveUrgency, durationScore);
  const stars = evaluateStars(effectivePriority, durationScore, effectiveUrgency, effectiveFeasibility);

  return {
    priority: data.priority,
    durationScore,
    urgency: data.urgency,
    feasibility: data.feasibility,
    coreScore,
    unresolvedAgeDays,
    stars,
    hasOverrides,
    effectivePriority,
    effectiveUrgency,
    effectiveFeasibility,
  };
}
