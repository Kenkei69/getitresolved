import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateAgeInDays,
  calculateDurationScore,
  evaluateStars,
  calculateCoreScore,
  computeComplaintScores,
} from '../../src/server/services/scoring';

describe('Scoring Rules & Formulas', () => {
  it('calculates duration score: min(10, floor(unresolvedAgeInDays / 3))', () => {
    // 0 to 2 days -> 0
    assert.strictEqual(calculateDurationScore(0), 0);
    assert.strictEqual(calculateDurationScore(1), 0);
    assert.strictEqual(calculateDurationScore(2), 0);

    // 3 to 5 days -> 1
    assert.strictEqual(calculateDurationScore(3), 1);
    assert.strictEqual(calculateDurationScore(5), 1);

    // 6 to 8 days -> 2
    assert.strictEqual(calculateDurationScore(6), 2);
    assert.strictEqual(calculateDurationScore(8), 2);

    // 21 days -> 7
    assert.strictEqual(calculateDurationScore(21), 7);
    // 24 days -> 8
    assert.strictEqual(calculateDurationScore(24), 8);

    // Capped at 10 for 30+ days
    assert.strictEqual(calculateDurationScore(30), 10);
    assert.strictEqual(calculateDurationScore(60), 10);
    assert.strictEqual(calculateDurationScore(100), 10);
  });

  it('freezes age at resolvedAt for resolved complaints', () => {
    const created = new Date('2026-01-01T00:00:00Z');
    const resolved = new Date('2026-01-10T00:00:00Z'); // 9 days later
    const futureNow = new Date('2026-06-01T00:00:00Z'); // 5 months later

    // Unresolved would be 151 days, but resolved freezes at 9 days!
    const ageDays = calculateAgeInDays(created, resolved, futureNow);
    assert.strictEqual(ageDays, 9);
    assert.strictEqual(calculateDurationScore(ageDays), 3); // floor(9/3) = 3
  });

  it('calculates core score with formula: round(0.45*priority + 0.40*urgency + 0.15*duration, 1)', () => {
    // Case 1: All 10s
    assert.strictEqual(calculateCoreScore(10, 10, 10), 10.0);

    // Case 2: Priority 8.0, Urgency 6.0, Duration 4.0
    // 0.45 * 8.0 = 3.6
    // 0.40 * 6.0 = 2.4
    // 0.15 * 4.0 = 0.6
    // Total = 6.6
    assert.strictEqual(calculateCoreScore(8.0, 6.0, 4.0), 6.6);

    // Case 3: Rounding check
    // 0.45 * 7.5 = 3.375
    // 0.40 * 8.2 = 3.28
    // 0.15 * 2.0 = 0.30
    // Sum = 6.955 -> rounds to 7.0
    assert.strictEqual(calculateCoreScore(7.5, 8.2, 2.0), 7.0);
  });

  it('enforces strict star threshold: strictly greater than 7.0 (> 7.0)', () => {
    // Exact 7.0 must NOT trigger any star!
    const exact7Stars = evaluateStars(7.0, 7.0, 7.0, 7.0);
    assert.strictEqual(exact7Stars.redPriority, false, 'Priority 7.0 must not trigger red star');
    assert.strictEqual(exact7Stars.pinkDuration, false, 'Duration 7.0 must not trigger pink star');
    assert.strictEqual(exact7Stars.orangeUrgency, false, 'Urgency 7.0 must not trigger orange star');
    assert.strictEqual(exact7Stars.greenFeasibility, false, 'Feasibility 7.0 must not trigger green star');

    // 7.1 must trigger star!
    const above7Stars = evaluateStars(7.1, 8.0, 7.5, 9.2);
    assert.strictEqual(above7Stars.redPriority, true, 'Priority 7.1 must trigger red star');
    assert.strictEqual(above7Stars.pinkDuration, true, 'Duration 8.0 must trigger pink star');
    assert.strictEqual(above7Stars.orangeUrgency, true, 'Urgency 7.5 must trigger orange star');
    assert.strictEqual(above7Stars.greenFeasibility, true, 'Feasibility 9.2 must trigger green star');
  });

  it('correctly incorporates human score overrides into core score calculation', () => {
    const scores = computeComplaintScores({
      createdAt: new Date(),
      priority: 5.0,
      urgency: 4.0,
      feasibility: 6.0,
      overridePriority: 9.0, // Human override
      overrideUrgency: 8.0,  // Human override
    });

    assert.strictEqual(scores.hasOverrides, true);
    assert.strictEqual(scores.effectivePriority, 9.0);
    assert.strictEqual(scores.effectiveUrgency, 8.0);
    // Core score should use 9.0 and 8.0:
    // 0.45 * 9.0 + 0.40 * 8.0 + 0.15 * 0 = 4.05 + 3.20 = 7.25 -> 7.3
    assert.strictEqual(scores.coreScore, 7.3);
    assert.strictEqual(scores.stars.redPriority, true);
    assert.strictEqual(scores.stars.orangeUrgency, true);
  });
});
