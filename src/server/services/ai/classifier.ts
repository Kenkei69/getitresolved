import { z } from 'zod';
import { CATEGORIES, SCORING_CONFIG } from '../../../shared/constants';

export interface AIClassificationResult {
  categoryCode: string;
  categoryName: string;
  confidence: number;
  priority: number;
  urgency: number;
  feasibility: number;
  rationale: string;
  provider: 'ai_analyzed' | 'rule_based_fallback' | 'needs_review';
  version: string;
  needsReview: boolean;
  reviewReason?: string;
}

const AIResponseSchema = z.object({
  categoryCode: z.enum(['ROADS', 'STREETLIGHTS', 'WATER', 'DRAINAGE', 'SANITATION', 'OTHER']),
  confidence: z.number().min(0).max(1),
  priority: z.number().min(0).max(10),
  urgency: z.number().min(0).max(10),
  feasibility: z.number().min(0).max(10),
  rationale: z.string().min(5).max(500),
});

/**
 * Deterministic rule-based fallback classifier
 */
export function classifyWithRules(title: string, description: string): AIClassificationResult {
  const combinedText = `${title} ${description}`.toLowerCase();

  // Match keyword counts for each category
  const scores: Record<string, number> = {
    ROADS: 0,
    STREETLIGHTS: 0,
    WATER: 0,
    DRAINAGE: 0,
    SANITATION: 0,
  };

  const roadKeywords = ['pothole', 'crater', 'asphalt', 'road damage', 'pavement', 'curb', 'street surface', 'traffic hazard', 'manhole cover broken', 'bumps', 'speed bump', 'road'];
  const lightKeywords = ['streetlight', 'street light', 'street lamp', 'lamp post', 'lamp', 'light pole', 'dark street', 'blackout', 'flicker', 'bulb', 'lighting', 'lantern', 'pole light'];
  const waterKeywords = ['pipe burst', 'water leak', 'tap water', 'contaminated water', 'low pressure', 'no water', 'water supply', 'water meter', 'drinking water', 'water main', 'hydrant', 'water'];
  const drainKeywords = ['drain', 'drainage', 'sewage', 'stench', 'manhole overflow', 'clogged gutter', 'storm drain', 'sewer', 'gutter', 'wastewater', 'cesspool'];
  const sanitationKeywords = ['garbage', 'trash', 'waste', 'litter', 'dumping', 'rubbish', 'refuse', 'sanitation', 'bins', 'dumpster', 'smell of garbage', 'debris'];

  for (const kw of roadKeywords) {
    if (combinedText.includes(kw)) scores.ROADS += kw.length > 5 ? 2 : 1;
  }
  for (const kw of lightKeywords) {
    if (combinedText.includes(kw)) scores.STREETLIGHTS += kw.length > 5 ? 2 : 1;
  }
  for (const kw of waterKeywords) {
    if (combinedText.includes(kw)) scores.WATER += kw.length > 5 ? 2 : 1;
  }
  for (const kw of drainKeywords) {
    if (combinedText.includes(kw)) scores.DRAINAGE += kw.length > 5 ? 2 : 1;
  }
  for (const kw of sanitationKeywords) {
    if (combinedText.includes(kw)) scores.SANITATION += kw.length > 5 ? 2 : 1;
  }

  // Find max category match
  let bestCategory = 'OTHER';
  let maxScore = 0;
  for (const [cat, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      bestCategory = cat;
    }
  }

  // Determine confidence
  let confidence = 0.50;
  if (maxScore >= 4) {
    confidence = 0.92;
  } else if (maxScore >= 2) {
    confidence = 0.82;
  } else if (maxScore === 1) {
    confidence = 0.68; // Below 0.75 -> triggers manual review
  } else {
    bestCategory = 'OTHER';
    confidence = 0.35;
  }

  // Transparent scoring rubrics based on keywords
  // Priority: disruption and essential health impact
  let priority = 5.0;
  if (combinedText.includes('severe') || combinedText.includes('huge') || combinedText.includes('flooding') || combinedText.includes('contamination') || combinedText.includes('hazard') || combinedText.includes('danger') || combinedText.includes('accident')) {
    priority = 8.5;
  } else if (combinedText.includes('minor') || combinedText.includes('small') || combinedText.includes('slight') || combinedText.includes('cosmetic')) {
    priority = 3.5;
  } else if (bestCategory === 'WATER' || bestCategory === 'DRAINAGE') {
    priority = 7.5; // High base essential-service priority
  } else if (bestCategory === 'ROADS') {
    priority = 6.5;
  } else {
    priority = 5.5;
  }

  // Urgency: speed of worsening condition or imminent safety hazard
  let urgency = 5.0;
  if (combinedText.includes('emergency') || combinedText.includes('immediate') || combinedText.includes('accident risk') || combinedText.includes('overflowing') || combinedText.includes('burst') || combinedText.includes('risk of injury') || combinedText.includes('dark')) {
    urgency = 8.8;
  } else if (combinedText.includes('gradual') || combinedText.includes('old') || combinedText.includes('months') || combinedText.includes('not urgent')) {
    urgency = 3.2;
  } else if (bestCategory === 'STREETLIGHTS' && combinedText.includes('dark')) {
    urgency = 7.8;
  } else {
    urgency = 5.8;
  }

  // Feasibility: provisional estimate of repair complexity
  let feasibility = 6.5;
  if (bestCategory === 'STREETLIGHTS' || combinedText.includes('bulb') || combinedText.includes('replace')) {
    feasibility = 8.5; // High feasibility (simple bulb or fixture fix)
  } else if (combinedText.includes('patch') || combinedText.includes('sweep') || combinedText.includes('pickup')) {
    feasibility = 7.8;
  } else if (combinedText.includes('rebuild') || combinedText.includes('main pipeline') || combinedText.includes('heavy machinery') || combinedText.includes('structural')) {
    feasibility = 3.5; // Complex civil works
  } else {
    feasibility = 6.0;
  }

  const catMeta = CATEGORIES.find((c) => c.code === bestCategory) || CATEGORIES.find((c) => c.code === 'OTHER')!;
  const needsReview = confidence < SCORING_CONFIG.confidenceThreshold || bestCategory === 'OTHER';
  const reviewReason = bestCategory === 'OTHER'
    ? 'Category classified as Other/uncertain; manual municipal review required.'
    : confidence < SCORING_CONFIG.confidenceThreshold
    ? `Classification confidence (${Math.round(confidence * 100)}%) is below administrative threshold (${Math.round(SCORING_CONFIG.confidenceThreshold * 100)}%).`
    : undefined;

  return {
    categoryCode: bestCategory,
    categoryName: catMeta.name,
    confidence,
    priority: Math.round(priority * 10) / 10,
    urgency: Math.round(urgency * 10) / 10,
    feasibility: Math.round(feasibility * 10) / 10,
    rationale: `Rule-based keyword heuristic matched ${bestCategory} with score ${maxScore}. Rationale: assessed essential service impact (${priority}/10), public hazard risk (${urgency}/10), and provisional task complexity (${feasibility}/10).`,
    provider: needsReview ? 'needs_review' : 'rule_based_fallback',
    version: 'rule-engine-v1.0',
    needsReview,
    reviewReason,
  };
}

/**
 * Classify complaint using configured provider with automatic safe fallback
 */
export async function classifyComplaint(title: string, description: string): Promise<AIClassificationResult> {
  const provider = process.env.AI_PROVIDER || 'fallback';
  const apiKey = process.env.GEMINI_API_KEY;

  if (provider === 'gemini' && apiKey && apiKey.trim().length > 0) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

      const prompt = `You are a municipal civic triage assistant. Analyze this citizen complaint:
Title: ${JSON.stringify(title)}
Description: ${JSON.stringify(description)}

Allowed categories:
- ROADS: Roads and potholes, damaged asphalt, craters, curbs, pavement
- STREETLIGHTS: Streetlights, dark streets, broken bulbs, pole wiring
- WATER: Water supply, pipe bursts, contaminated water, tap water outages
- DRAINAGE: Drainage and sewage, overflowing storm drains, sewer stench
- SANITATION: Garbage and sanitation, uncollected trash, illegal dumping
- OTHER: Ambiguous or other domain

Rubric (0.0 to 10.0 scale):
- priority: disruption and essential health impact
- urgency: immediate accident risk or rapid worsening
- feasibility: provisional ease of resolution (e.g. 8-9 for simple fix, 2-4 for major construction)

Output strictly valid JSON with this exact structure:
{
  "categoryCode": "ROADS" | "STREETLIGHTS" | "WATER" | "DRAINAGE" | "SANITATION" | "OTHER",
  "confidence": number (between 0.0 and 1.0),
  "priority": number (between 0.0 and 10.0),
  "urgency": number (between 0.0 and 10.0),
  "feasibility": number (between 0.0 and 10.0),
  "rationale": string (brief explanation under 200 chars)
}`;

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const parsed = JSON.parse(rawText);
          const validated = AIResponseSchema.parse(parsed);
          const catMeta = CATEGORIES.find((c) => c.code === validated.categoryCode) || CATEGORIES.find((c) => c.code === 'OTHER')!;
          const needsReview = validated.confidence < SCORING_CONFIG.confidenceThreshold || validated.categoryCode === 'OTHER';

          return {
            categoryCode: validated.categoryCode,
            categoryName: catMeta.name,
            confidence: Math.round(validated.confidence * 100) / 100,
            priority: Math.round(validated.priority * 10) / 10,
            urgency: Math.round(validated.urgency * 10) / 10,
            feasibility: Math.round(validated.feasibility * 10) / 10,
            rationale: validated.rationale,
            provider: needsReview ? 'needs_review' : 'ai_analyzed',
            version: 'gemini-1.5-flash-v1',
            needsReview,
            reviewReason: needsReview
              ? validated.categoryCode === 'OTHER'
                ? 'Category classified as Other/uncertain.'
                : `AI confidence heuristic (${Math.round(validated.confidence * 100)}%) is below operational threshold.`
              : undefined,
          };
        }
      }
    } catch (err) {
      console.warn('[AI Classifier] Gemini provider call failed or timed out, falling back safely to deterministic rules:', err);
    }
  }

  // Safe transparent rule-based fallback
  return classifyWithRules(title, description);
}
