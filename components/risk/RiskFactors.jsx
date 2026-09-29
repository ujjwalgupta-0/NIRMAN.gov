"use client";

import { calculateRiskIndices } from "@/lib/risk-engine.mjs";

const RULES = [
  { key: "scheduleDelay", label: "Schedule delay", unit: " months", neutral: 0 },
  { key: "monthsPastDeadline", label: "Months past planned completion", unit: " months", neutral: 0 },
  { key: "monthsToCompletion", label: "Time to planned completion", unit: " months", neutral: 12 },
  { key: "plannedProgress", label: "Progress against plan", neutralize: (p) => ({ actualProgress: p.plannedProgress }), format: (p) => `${p.actualProgress ?? "—"}% actual / ${p.plannedProgress}% planned${p.actualProgress == null ? "" : ` · ${Math.max(0, p.plannedProgress - p.actualProgress).toFixed(1)} pp behind`}` },
  { key: "spendPct", label: "Spend against budget", unit: "%", neutral: 100 },
  { key: "budgetExceeded", label: "Budget exceeded", unit: " Cr", neutral: 0 },
  { key: "remainingBudget", label: "Remaining budget", unit: " Cr", neutral: 1 },
  { key: "costOverrunToDate", label: "Cost overrun to date", unit: "%", neutral: 0 },
  { key: "milestoneCompletion", label: "Milestone completion", unit: "%", neutral: 100 },
  { key: "milestoneOnTime", label: "Milestones completed on time", unit: "%", neutral: 100 },
  { key: "qualityScore", label: "Quality score", unit: "/100", neutral: 82 },
  { key: "materialPass", label: "Material test pass rate", unit: "%", neutral: 90 },
  { key: "inspectionScore", label: "Site inspection score", unit: "/100", neutral: 80 },
  { key: "reworkPct", label: "Rework", unit: "%", neutral: 5 },
  { key: "contractorHistory", label: "Contractor prior completed projects", unit: " projects", neutral: 10 },
  { key: "contractorDelayRate", label: "Contractor historical delay rate", unit: "%", neutral: 0 },
  { key: "contractorDelayMonths", label: "Contractor average historical delay", unit: " months", neutral: 0 },
  { key: "contractorCostOverrunRate", label: "Contractor historical cost overrun rate", unit: "%", neutral: 0 },
  { key: "contractorWorkload", label: "Contractor current workload", unit: " projects", neutral: 0 },
  { key: "workingDayLoss", label: "Calendar working day loss", unit: "%", neutral: 0 },
  { key: "festivalCount", label: "Festival days this month", unit: " days", neutral: 0 },
  { key: "monsoonDaysThisMonth", label: "Monsoon days this month", unit: " days", neutral: 0 },
  { key: "rainfallPct", label: "Rainfall vs normal", unit: "%", neutral: 100 }
];

const display = (value, unit = "") => `${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 1 })}${unit}`;
const riskFor = (values) => calculateRiskIndices(values).headline;

function FactorCard({ factor, index, maximum, tone }) {
  const pressure = tone === "pressure";
  return <li className={`rounded-lg border px-2.5 py-2 ${pressure ? "border-rose-200 bg-gradient-to-br from-white to-rose-50/80" : "border-emerald-200 bg-gradient-to-br from-white to-emerald-50/80"}`}>
    <div className="flex items-center gap-2"><span className={`grid h-6 w-6 shrink-0 place-items-center rounded-md text-[10px] font-black ${pressure ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"}`}>{String(index + 1).padStart(2, "0")}</span><h4 className="min-w-0 flex-1 text-xs font-bold leading-snug text-slate-900">{factor.rule.label}</h4><span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-extrabold tabular-nums ${pressure ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"}`}>{pressure ? "+" : "−"}{factor.magnitude.toFixed(1)} pts</span></div>
    <div className="ml-8 mt-1 flex items-center gap-2"><p className="min-w-0 truncate text-[10px] font-semibold tabular-nums text-slate-600">{factor.rule.format ? factor.rule.format(factor.values) : display(factor.values[factor.rule.key], factor.rule.unit)}</p><div className="h-1.5 min-w-12 flex-1 overflow-hidden rounded-full bg-slate-200"><div className={`h-full rounded-full ${pressure ? "bg-rose-600" : "bg-emerald-600"}`} style={{ width: `${Math.max(5, factor.magnitude / maximum * 100)}%` }} /></div></div>
  </li>;
}

export default function RiskFactors({ project }) {
  const values = project.scenarioInputs ?? {};
  const baselineRisk = riskFor(values);
  const measured = RULES.filter((rule) => Number.isFinite(values[rule.key])).map((rule) => {
    const neutralValues = rule.neutralize ? rule.neutralize(values) : { [rule.key]: rule.neutral };
    const neutralRisk = riskFor({ ...values, ...neutralValues });
    return { rule, values, effect: baselineRisk - neutralRisk, magnitude: Math.abs(baselineRisk - neutralRisk) };
  });
  const pressures = measured.filter((factor) => factor.effect > 0.05).sort((a, b) => b.magnitude - a.magnitude);
  const favorable = measured.filter((factor) => factor.effect < -0.05).sort((a, b) => b.magnitude - a.magnitude);
  const neutral = measured.filter((factor) => Math.abs(factor.effect) <= 0.05);
  const maximum = Math.max(1, ...measured.map((factor) => factor.magnitude));

  return <div>
    <div className="mb-4 flex flex-wrap items-end justify-between gap-2"><div><p className="text-xs text-slate-600">Ranked by estimated effect on the headline risk index.</p><p className="mt-0.5 text-[11px] text-slate-500">Compared with a neutral reference using the same scoring rules.</p></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700">{measured.length} parameters</span></div>
    <div className="grid gap-4 xl:grid-cols-2">
      <section className="rounded-xl border border-rose-200 bg-rose-50/60 p-3 sm:p-4">
        <div className="mb-3 flex items-center justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-rose-700">Risk pressure</p><h3 className="mt-0.5 text-base font-black text-slate-950">Holding the project back</h3></div><span className="grid h-8 min-w-8 place-items-center rounded-xl bg-rose-700 px-2 text-sm font-black text-white">{pressures.length}</span></div>
        {pressures.length ? <ol className="space-y-2">{pressures.map((factor, index) => <FactorCard key={factor.rule.key} factor={factor} index={index} maximum={maximum} tone="pressure" />)}</ol> : <p className="rounded-lg border border-rose-200 bg-white p-3 text-xs text-slate-600">No measured parameters are increasing the current index.</p>}
      </section>
      <section className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 sm:p-4">
        <div className="mb-3 flex items-center justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700">Protective factors</p><h3 className="mt-0.5 text-base font-black text-slate-950">Working in its favor</h3></div><span className="grid h-8 min-w-8 place-items-center rounded-xl bg-emerald-700 px-2 text-sm font-black text-white">{favorable.length}</span></div>
        {favorable.length ? <ol className="space-y-2">{favorable.map((factor, index) => <FactorCard key={factor.rule.key} factor={factor} index={index} maximum={maximum} tone="favorable" />)}</ol> : <p className="rounded-lg border border-emerald-200 bg-white p-3 text-xs text-slate-600">No measured parameters reduce the index against neutral reference values.</p>}
      </section>
    </div>
    {neutral.length > 0 && <details className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3"><summary className="cursor-pointer text-xs font-bold text-slate-800">{neutral.length} reported parameters have little modeled effect</summary><ul className="mt-2 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">{neutral.map(({ rule }) => <li key={rule.key} className="flex justify-between gap-2 rounded bg-white px-2.5 py-1.5 text-xs"><span className="text-slate-600">{rule.label}</span><strong className="text-right text-slate-800">{rule.format ? rule.format(values) : display(values[rule.key], rule.unit)}</strong></li>)}</ul></details>}
    {!measured.length && <p className="mt-3 rounded-lg border border-dashed border-slate-300 p-4 text-xs text-slate-600">Project parameter details were not included in this snapshot.</p>}
  </div>;
}
