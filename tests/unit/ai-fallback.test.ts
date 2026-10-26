import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { classifyWithRules, classifyComplaint } from '../../src/server/services/ai/classifier';

describe('AI Classifier & Rule-based Fallback', () => {
  it('correctly categorizes road damage from keywords', () => {
    const result = classifyWithRules('Giant pothole on 5th Ave', 'Car tires popped in deep crater in asphalt');
    assert.strictEqual(result.categoryCode, 'ROADS');
    assert.ok(result.confidence >= 0.75);
    assert.strictEqual(result.needsReview, false);
    assert.strictEqual(result.provider, 'rule_based_fallback');
  });

  it('correctly categorizes streetlights and assigns high urgency when dark', () => {
    const result = classifyWithRules('Street lamp broken', 'The entire street is pitch dark and dangerous at night');
    assert.strictEqual(result.categoryCode, 'STREETLIGHTS');
    assert.ok(result.urgency > 7.0); // Urgent because dark
    assert.strictEqual(result.needsReview, false);
  });

  it('correctly categorizes pipe burst with high priority', () => {
    const result = classifyWithRules('Water pipe burst', 'Severe flooding of tap water from broken underground pipe');
    assert.strictEqual(result.categoryCode, 'WATER');
    assert.ok(result.priority > 7.0);
    assert.strictEqual(result.needsReview, false);
  });

  it('triggers manual review when ambiguous text matches "Other / uncertain"', () => {
    const result = classifyWithRules('General inquiry', 'Something strange happened near my fence yesterday');
    assert.strictEqual(result.categoryCode, 'OTHER');
    assert.strictEqual(result.needsReview, true);
    assert.strictEqual(result.provider, 'needs_review');
    assert.ok(result.confidence < 0.75);
  });

  it('safely handles timeouts or unavailable AI keys by executing fallback', async () => {
    // When no key or invalid key is configured, it falls back seamlessly
    const result = await classifyComplaint('Uncollected trash bags', 'Rotting garbage piled up near park bins');
    assert.strictEqual(result.categoryCode, 'SANITATION');
    assert.ok(result.confidence >= 0.75);
    assert.ok(result.rationale.length > 5);
  });
});
