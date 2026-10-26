import React from 'react';
import { Star, Clock, AlertTriangle, ShieldCheck, CheckCircle2, Info } from 'lucide-react';

export const HowScoringWorksPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="space-y-2 border-b border-slate-200 pb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-civic-100 text-civic-900 border border-civic-200">
          <Info className="w-3.5 h-3.5 text-civic-600" />
          Transparent Municipal Rubrics
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          How Scoring & Star Indicators Work
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          Getitresolved uses a multi-factor impact assessment system to prioritize complaints objectively based on public safety, disruption, and duration — preventing urgent issues from being lost in high caseloads.
        </p>
      </div>

      {/* 4 Assessment Metrics */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900">1. The Four Assessment Metrics (0–10 Scale)</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Priority */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-base">Priority Score</span>
              <span className="text-xs font-bold text-civic-700 bg-civic-50 px-2 py-0.5 rounded border border-civic-200">
                45% of Core Score
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Measures overall civic impact, including disruption of public transit, breadth of affected citizens, and disruption of essential municipal utilities (drinking water, sewage, main roadways).
            </p>
          </div>

          {/* Urgency */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-base">Urgency Score</span>
              <span className="text-xs font-bold text-civic-700 bg-civic-50 px-2 py-0.5 rounded border border-civic-200">
                40% of Core Score
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Measures how quickly action is required based on active bodily injury risk, vehicular accident hazard, pitch-black intersections, or rapid progressive structural deterioration.
            </p>
          </div>

          {/* Duration */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-base">Duration Score</span>
              <span className="text-xs font-bold text-civic-700 bg-civic-50 px-2 py-0.5 rounded border border-civic-200">
                15% of Core Score
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Quantifies how long an issue has remained unaddressed. Calculated directly on the server from the submission timestamp:
            </p>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-mono text-xs text-slate-800">
              durationScore = min(10, floor(unresolvedAgeInDays / 3))
            </div>
            <p className="text-[11px] text-slate-500">
              One point per 3 days elapsed, capped at 10 points after 30 days. For resolved complaints, age is permanently frozen at the resolution timestamp.
            </p>
          </div>

          {/* Feasibility */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-base">Provisional Feasibility</span>
              <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Excluded from Core Score
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              An initial estimate of resolution ease (e.g. quick bulb change vs complex main road repaving).
            </p>
            <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
              <b>Design Principle:</b> Feasibility is displayed and filterable but strictly excluded from the core score formula so difficult, complex problems are not deprioritized.
            </div>
          </div>
        </div>
      </section>

      {/* Core Score Formula */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h2 className="text-xl font-bold text-slate-900">2. Core Score Formula</h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          The overall ranking score is calculated using weighted linear combination and rounded to 1 decimal place:
        </p>

        <div className="bg-slate-900 text-white p-4 rounded-xl font-mono text-sm overflow-x-auto shadow-inner">
          coreScore = round( 0.45 × priority + 0.40 × urgency + 0.15 × durationScore, 1 )
        </div>

        <p className="text-xs text-slate-500">
          Rankings are computed dynamically on the server upon query, ensuring sorting and queue prioritization never become stale as complaints age.
        </p>
      </section>

      {/* Star Indicators Legend */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
          3. Colored Star Indicators
        </h2>
        <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 font-medium">
          <b>Strict Threshold:</b> A star is awarded only when an assessment metric is <u>strictly greater than 7.0</u> (&gt; 7.0). An exact score of 7.0 does NOT trigger a star.
        </div>

        <div className="space-y-3 pt-2">
          {/* Red Star */}
          <div className="p-4 rounded-xl border border-red-200 bg-red-50/50 flex items-start gap-3">
            <span className="text-priorityRed text-2xl font-bold leading-none mt-0.5">★</span>
            <div>
              <h3 className="font-bold text-sm text-red-900">Red Star — Priority &gt; 7.0</h3>
              <p className="text-xs text-red-800 mt-1 leading-relaxed">
                Indicates widespread public disruption, hazardous contamination, or major municipal utility failure.
              </p>
            </div>
          </div>

          {/* Pink Star */}
          <div className="p-4 rounded-xl border border-pink-200 bg-pink-50/50 flex items-start gap-3">
            <span className="text-durationPink text-2xl font-bold leading-none mt-0.5">★</span>
            <div>
              <h3 className="font-bold text-sm text-pink-900">Pink Star — Duration &gt; 7.0</h3>
              <p className="text-xs text-pink-800 mt-1 leading-relaxed">
                Indicates a complaint that has remained unresolved for more than 21 days (floor(age / 3) &gt; 7).
              </p>
            </div>
          </div>

          {/* Orange Star */}
          <div className="p-4 rounded-xl border border-orange-200 bg-orange-50/50 flex items-start gap-3">
            <span className="text-urgencyOrange text-2xl font-bold leading-none mt-0.5">★</span>
            <div>
              <h3 className="font-bold text-sm text-orange-900">Orange Star — Urgency &gt; 7.0</h3>
              <p className="text-xs text-orange-800 mt-1 leading-relaxed">
                Indicates imminent danger, active accident risk, dark pedestrian crossings, or rapid worsening conditions.
              </p>
            </div>
          </div>

          {/* Green Star */}
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-start gap-3">
            <span className="text-feasibilityGreen text-2xl font-bold leading-none mt-0.5">★</span>
            <div>
              <h3 className="font-bold text-sm text-emerald-900">Green Star — Feasibility &gt; 7.0</h3>
              <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                Indicates provisional assessment of a high-feasibility, relatively rapid resolution (e.g. bulb swap or street debris pickup).
              </p>
            </div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
          <b>Important Note:</b> These stars represent objective assessment threshold triggers, <i>not citizen satisfaction ratings</i>. A complaint can qualify for multiple stars simultaneously.
        </div>
      </section>

      {/* Human Overrides */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
        <h2 className="text-xl font-bold text-slate-900">4. Administrative Overrides & Audit Integrity</h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          While AI models and automated rule heuristics provide immediate triage, municipal administrators can manually adjust any score metric. When an override occurs:
        </p>
        <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1.5 leading-relaxed">
          <li>The original automated score is permanently preserved for transparency.</li>
          <li>A mandatory written justification reason is required.</li>
          <li>The administrator's identity and timestamp are recorded in the immutable audit timeline.</li>
          <li>The effective overridden values are automatically utilized in recomputing the live core score.</li>
        </ul>
      </section>
    </div>
  );
};
