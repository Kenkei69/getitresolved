import React from 'react';
import { Star, Clock, AlertTriangle, ShieldCheck, CheckCircle2, Info, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const HowScoringWorksPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Page Header & Navigation */}
      <div className="space-y-4 border-b border-slate-200 pb-8">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Back to Home</span>
        </Link>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-civic-100 text-civic-900 border border-civic-200">
            <Info className="w-4 h-4 text-civic-600" aria-hidden="true" />
            <span>Public Civic Rubrics</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            How Scoring & Star Indicators Work
          </h1>
          <p className="text-base text-slate-600 leading-relaxed max-w-2xl">
            Getitresolved uses an objective, multi-factor impact assessment formula to prioritize complaints based on public safety, disruption, and duration — ensuring critical civic problems are handled transparently.
          </p>
        </div>
      </div>

      {/* Section 1: The Three Core Metrics + Feasibility */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">1. Assessment Metrics (0–10 Scale)</h2>
        <p className="text-sm text-slate-600">
          The core ranking score combines three objective factors. Feasibility is assessed separately:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Priority */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-lg">Priority</h3>
              <span className="text-xs font-bold text-civic-800 bg-civic-50 px-2.5 py-1 rounded-lg border border-civic-200">
                45% of Core Score
              </span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Measures the breadth of civic disruption: transit delays, number of affected citizens, and interruption of essential municipal utilities like clean water, sewage, or primary roads.
            </p>
          </div>

          {/* Urgency */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-lg">Urgency</h3>
              <span className="text-xs font-bold text-civic-800 bg-civic-50 px-2.5 py-1 rounded-lg border border-civic-200">
                40% of Core Score
              </span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Measures how rapidly action is needed based on physical injury risk, vehicular accident danger, unlit dark pedestrian zones, or progressive structural degradation.
            </p>
          </div>

          {/* Duration */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-lg">Duration</h3>
              <span className="text-xs font-bold text-civic-800 bg-civic-50 px-2.5 py-1 rounded-lg border border-civic-200">
                15% of Core Score
              </span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Quantifies how long an issue has remained unresolved since submission. Computed automatically on the server:
            </p>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-xs text-slate-800">
              durationScore = min(10, floor(unresolvedAgeInDays / 3))
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Adds 1 point for every 3 complete days elapsed, capped at 10. For resolved complaints, age permanently freezes at the resolution timestamp.
            </p>
          </div>

          {/* Feasibility (Provisional & Excluded) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-lg">Provisional Feasibility</h3>
              <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                Excluded from Core Score
              </span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              An initial estimate of resolution ease (e.g. simple street bulb replacement versus whole-street resurfacing).
            </p>
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
              <b>Important Design Principle:</b> Feasibility is displayed for planning purposes but <b>strictly excluded</b> from the core score formula so difficult, complex problems are not pushed down or deprioritized.
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Core Score Formula */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">2. The Core Score Formula</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          The overall ranking score is calculated using weighted linear combination and rounded to 1 decimal place:
        </p>

        <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-2xl font-mono text-sm sm:text-base overflow-x-auto shadow-inner">
          coreScore = round( 0.45 × priority + 0.40 × urgency + 0.15 × durationScore, 1 )
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          Scores are computed dynamically when queues are viewed, guaranteeing sorting order remains accurate as unresolved days increase.
        </p>
      </section>

      {/* Section 3: Colored Star Indicators */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Star className="w-6 h-6 text-amber-500 fill-amber-500" aria-hidden="true" />
            <span>3. Objective Star Indicators (&gt; 7.0 Threshold)</span>
          </h2>
          <p className="text-sm text-slate-600 mt-1 leading-relaxed">
            Stars are objective indicator badges that appear only when a metric is <b>strictly greater than 7.0</b>. An exact score of 7.0 does not trigger a star.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
          <b>Assessment Indicators, Not Citizen Ratings:</b> These stars indicate high severity or prolonged duration assessed by municipal rubrics, not user-submitted star ratings.
        </div>

        <div className="space-y-3 pt-2">
          {/* Priority Star (Red) */}
          <div className="p-4 rounded-xl border border-red-200 bg-red-50/60 flex items-start gap-3.5">
            <span className="text-priorityRed text-2xl font-bold leading-none mt-0.5" aria-hidden="true">★</span>
            <div>
              <h3 className="font-bold text-base text-red-950">Red Star — Priority &gt; 7.0</h3>
              <p className="text-sm text-red-800 mt-1 leading-relaxed">
                Appears when civic disruption, contamination, or major municipal utility failure exceeds 7.0.
              </p>
            </div>
          </div>

          {/* Duration Star (Pink) */}
          <div className="p-4 rounded-xl border border-pink-200 bg-pink-50/60 flex items-start gap-3.5">
            <span className="text-durationPink text-2xl font-bold leading-none mt-0.5" aria-hidden="true">★</span>
            <div>
              <h3 className="font-bold text-base text-pink-950">Pink Star — Duration &gt; 7.0 (Age &ge; 24 Days)</h3>
              <p className="text-sm text-pink-800 mt-1 leading-relaxed">
                Under the <code className="bg-pink-100 px-1 py-0.5 rounded font-mono text-xs">duration = min(10, floor(days / 3))</code> formula, a score of 7 is reached at 21 days (floor(21/3) = 7). Because the star threshold is <b>strictly greater than 7.0</b>, the duration score first exceeds 7 at <b>24 complete days</b> (floor(24/3) = 8 &gt; 7.0).
              </p>
            </div>
          </div>

          {/* Urgency Star (Orange) */}
          <div className="p-4 rounded-xl border border-orange-200 bg-orange-50/60 flex items-start gap-3.5">
            <span className="text-urgencyOrange text-2xl font-bold leading-none mt-0.5" aria-hidden="true">★</span>
            <div>
              <h3 className="font-bold text-base text-orange-950">Orange Star — Urgency &gt; 7.0</h3>
              <p className="text-sm text-orange-800 mt-1 leading-relaxed">
                Appears when immediate bodily safety risk, collision hazard, or acute structural danger exceeds 7.0.
              </p>
            </div>
          </div>

          {/* Feasibility Star (Green) */}
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 flex items-start gap-3.5">
            <span className="text-feasibilityGreen text-2xl font-bold leading-none mt-0.5" aria-hidden="true">★</span>
            <div>
              <h3 className="font-bold text-base text-emerald-950">Green Star — Provisional Feasibility &gt; 7.0</h3>
              <p className="text-sm text-emerald-800 mt-1 leading-relaxed">
                Provisional assessment indicating relatively rapid, straightforward municipal resolution (such as replacing a burned-out lightbulb or clearing street debris).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Human Overrides & Audit Accountability */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">4. Administrative Overrides & Audit Accountability</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          While automated classifiers provide immediate initial triage, municipal administrators can manually adjust scores when on-the-ground conditions warrant:
        </p>
        <ul className="list-disc pl-5 text-sm text-slate-700 space-y-2 leading-relaxed">
          <li>The original automated score is permanently archived for transparency.</li>
          <li>A mandatory written justification reason must be submitted with every override.</li>
          <li>The administrator's identity and timestamp are recorded in the immutable audit log.</li>
          <li>The overridden values immediately feed into the live core score calculation.</li>
        </ul>
      </section>
    </div>
  );
};
