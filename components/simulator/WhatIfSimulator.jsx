"use client";

import { useMemo, useState } from "react";
import RiskMeter from "@/components/risk/RiskMeter";
import { band, BAND_STYLE, HEX, THRESHOLDS } from "@/lib/risk";
import { calculateRiskIndices } from "@/lib/risk-engine.mjs";

const SECTIONS = [
  { title: "Progress and schedule", fields: [
    { key: "actualProgress", label: "Actual progress", unit: "%", min: 0, max: 100, step: 1, fallback: "physical" },
    { key: "plannedProgress", label: "Planned progress", unit: "%", min: 0, max: 100, step: 1, fallback: "expectedPhysical" },
    { key: "monthsToCompletion", label: "Months to planned completion", unit: "months", min: -24, max: 120, step: 1 },
    { key: "monthsPastDeadline", label: "Months past planned completion", unit: "months", min: 0, max: 60, step: 1 },
    { key: "scheduleDelay", label: "Schedule delay to date", unit: "months", min: 0, max: 60, step: 1 }
  ] },
  { title: "Budget and spending", fields: [
    { key: "spendPct", label: "Spend against budget", unit: "%", min: 0, max: 250, step: 1, fallback: "financial" },
    { key: "costOverrunToDate", label: "Cost overrun to date", unit: "%", min: 0, max: 300, step: 1 },
    { key: "remainingBudget", label: "Remaining budget", unit: "Cr", min: -10000, max: 10000, step: 10 },
    { key: "budgetExceeded", label: "Budget exceeded", unit: "Cr", min: 0, max: 10000, step: 10 }
  ] },
  { title: "Milestones and quality", fields: [
    { key: "milestoneCompletion", label: "Milestones completed", unit: "%", min: 0, max: 100, step: 1 },
    { key: "milestoneOnTime", label: "Milestones on time", unit: "%", min: 0, max: 100, step: 1 },
    { key: "qualityScore", label: "Quality score", unit: "/ 100", min: 0, max: 100, step: 1 },
    { key: "materialPass", label: "Material test pass rate", unit: "%", min: 0, max: 100, step: 1 },
    { key: "inspectionScore", label: "Site inspection score", unit: "/ 100", min: 0, max: 100, step: 1 },
    { key: "reworkPct", label: "Rework", unit: "%", min: 0, max: 100, step: 1 }
  ] },
  { title: "Contractor delivery", fields: [
    { key: "contractorWorkload", label: "Contractor active workload", unit: "projects", min: 0, max: 30, step: 1 },
    { key: "contractorHistory", label: "Prior completed projects", unit: "projects", min: 0, max: 50, step: 1 },
    { key: "contractorDelayRate", label: "Contractor historical delay rate", unit: "%", min: 0, max: 100, step: 1 },
    { key: "contractorDelayMonths", label: "Contractor average historical delay", unit: "months", min: 0, max: 36, step: 1 },
    { key: "contractorCostOverrunRate", label: "Contractor historical cost overrun rate", unit: "%", min: 0, max: 100, step: 1 }
  ] },
  { title: "Calendar and weather", fields: [
    { key: "workingDayLoss", label: "Working-day loss", unit: "%", min: 0, max: 100, step: 1 },
    { key: "festivalCount", label: "Festival days this month", unit: "days", min: 0, max: 31, step: 1 },
    { key: "monsoonDaysThisMonth", label: "Monsoon days this month", unit: "days", min: 0, max: 31, step: 1 },
    { key: "rainfallPct", label: "Rainfall vs normal", unit: "%", min: 0, max: 300, step: 1 }
  ] }
];

const FIELDS = SECTIONS.flatMap((section) => section.fields.map((field) => ({ ...field, section: section.title })));
const BASELINE = (project) => {
  const inputs = project?.scenarioInputs ?? {};
  return Object.fromEntries(FIELDS.map((field) => {
    const value = inputs[field.key] ?? project?.[field.fallback];
    const parsed = Number(value);
    return [field.key, value != null && value !== "" && Number.isFinite(parsed) ? parsed : 0];
  }));
};
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const formatValue = (value) => Number.isFinite(Number(value)) ? Number(value).toLocaleString("en-IN", { maximumFractionDigits: 1 }) : String(value ?? "Unavailable");
const bandLabel = (risk) => BAND_STYLE[band(risk)]?.label ?? BAND_STYLE.GREEN.label;
const FORECASTS = [
  ["delay6", "Schedule · 6 months", "delayRisk6m"],
  ["delay12", "Schedule · 12 months", "delayRisk12m"],
  ["cost6", "Cost · 6 months", "costRisk6m"],
  ["cost12", "Cost · 12 months", "costRisk12m"]
];

function PresetButton({ label, onClick }) {
  return <button type="button" onClick={onClick} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-gov-800 shadow-sm transition hover:border-gov-700 hover:bg-gov-50">{label}</button>;
}

function ScoreTile({ label, before, after }) {
  const delta = after - before;
  return <div className="rounded-lg border border-slate-200 bg-white p-2"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-0.5 text-base font-black tabular-nums text-slate-950">{after.toFixed(1)}%</p><p className={`text-[10px] font-bold tabular-nums ${delta > 0.05 ? "text-rose-700" : delta < -0.05 ? "text-emerald-700" : "text-slate-500"}`}>{delta > 0.05 ? "+" : ""}{delta.toFixed(1)} pts <span className="font-medium text-slate-500">from {before.toFixed(1)}%</span></p></div>;
}

const dialPoint = (value, radius) => {
  const angle = Math.PI * (1 - value / 100);
  return { x: 60 + radius * Math.cos(angle), y: 61 - radius * Math.sin(angle) };
};
const dialArc = (start, end, radius = 40) => {
  const from = dialPoint(start, radius);
  const to = dialPoint(end, radius);
  return `M ${from.x} ${from.y} A ${radius} ${radius} 0 0 1 ${to.x} ${to.y}`;
};

function HeadlineMeter({ label, value }) {
  const level = band(value);
  const levelLabel = BAND_STYLE[level]?.label ?? BAND_STYLE.GREEN.label;
  return <div className="rounded-lg border border-slate-200 bg-white p-2.5">
    <div className="flex items-center justify-between gap-2"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p><span className="text-[10px] font-bold text-slate-500">{levelLabel}</span></div>
    <p className="mt-0.5 text-2xl font-black tabular-nums text-slate-950">{value.toFixed(1)}%</p>
    <svg viewBox="0 0 120 76" className="mt-1 w-full" role="meter" aria-label={`${label}: ${value.toFixed(1)} percent, ${levelLabel} risk`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}>
      <path d={dialArc(0, 100)} fill="none" stroke="#e2e8f0" strokeWidth="9" strokeLinecap="round" />
      <path d={dialArc(0, THRESHOLDS.amber)} fill="none" stroke="#22c55e" strokeWidth="7" />
      <path d={dialArc(THRESHOLDS.amber, THRESHOLDS.red)} fill="none" stroke="#f59e0b" strokeWidth="7" />
      <path d={dialArc(THRESHOLDS.red, 100)} fill="none" stroke="#ef4444" strokeWidth="7" />
      <text x="3" y="70" className="fill-slate-500 text-[7px]">0%</text>
      <text x={dialPoint(THRESHOLDS.amber, 51).x} y={dialPoint(THRESHOLDS.amber, 51).y - 1} textAnchor="middle" className="fill-slate-600 text-[7px]">30%</text>
      <text x={dialPoint(THRESHOLDS.red, 51).x} y={dialPoint(THRESHOLDS.red, 51).y - 1} textAnchor="middle" className="fill-slate-600 text-[7px]">60%</text>
      <text x="117" y="70" textAnchor="end" className="fill-slate-500 text-[7px]">100%</text>
      {(() => {
        const tip = dialPoint(value, 30);
        return <><line x1="60" y1="61" x2={tip.x} y2={tip.y} stroke={HEX[level]} strokeWidth="3" strokeLinecap="round" /><circle cx="60" cy="61" r="4" fill={HEX[level]} stroke="white" strokeWidth="1.5" /></>;
      })()}
    </svg>
  </div>;
}

export default function WhatIfSimulator({ baseline }) {
  const [target, setTarget] = useState("delay");
  const [horizon, setHorizon] = useState("6");
  const startingValues = useMemo(() => BASELINE(baseline), [baseline]);
  const [values, setValues] = useState(startingValues);
  const [submitted, setSubmitted] = useState(null);
  const fieldsWithValues = useMemo(() => FIELDS.map((field) => ({ ...field, base: startingValues[field.key], value: values[field.key] })), [startingValues, values]);
  const changed = fieldsWithValues.filter((field) => field.value !== field.base);
  const baselineScores = useMemo(() => calculateRiskIndices(startingValues), [startingValues]);
  const forecastKey = `${target}Risk${horizon}m`;
  const selectedRisk = baseline?.[forecastKey];
  const reportScores = submitted ? calculateRiskIndices(submitted) : null;
  const reportChanged = submitted ? FIELDS.filter((field) => submitted[field.key] !== startingValues[field.key]) : [];
  const reportOutliers = reportScores ? reportChanged.map((field) => {
    const without = calculateRiskIndices({ ...submitted, [field.key]: startingValues[field.key] });
    return { ...field, value: submitted[field.key], base: startingValues[field.key], effect: reportScores.headline - without.headline };
  }).filter((field) => Math.abs(field.effect) > 0.05).sort((a, b) => Math.abs(b.effect) - Math.abs(a.effect)) : [];
  const staleReport = submitted && FIELDS.some((field) => submitted[field.key] !== values[field.key]);

  const baselinePreset = () => setValues(startingValues);
  const progressPreset = () => setValues((current) => ({
    ...current,
    actualProgress: clamp(current.actualProgress - 8, 0, 100),
    scheduleDelay: clamp(current.scheduleDelay + 2, 0, 60),
    monthsToCompletion: clamp(current.monthsToCompletion - 2, -24, 120)
  }));
  const budgetPreset = () => setValues((current) => ({
    ...current,
    spendPct: clamp(current.spendPct + 10, 0, 250),
    costOverrunToDate: clamp(current.costOverrunToDate + 3, 0, 300),
    remainingBudget: clamp(current.remainingBudget - Math.max(10, Math.abs(current.remainingBudget) * 0.1), -10000, 10000)
  }));
  const deliveryPreset = () => setValues((current) => ({
    ...current,
    milestoneOnTime: clamp(current.milestoneOnTime - 15, 0, 100),
    qualityScore: clamp(current.qualityScore - 8, 0, 100),
    reworkPct: clamp(current.reworkPct + 4, 0, 100),
    workingDayLoss: clamp(current.workingDayLoss + 5, 0, 100)
  }));
  const submitScenario = (event) => {
    event.preventDefault();
    setSubmitted({ ...values });
  };

  return <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(300px,0.95fr)]">
    <form onSubmit={submitScenario} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-gov-700">Scenario builder</p><h3 className="mt-0.5 text-lg font-black text-slate-950">Change project assumptions</h3><p className="mt-0.5 text-xs text-slate-600">Adjust and submit to update the index.</p></div><button type="button" className="text-xs font-bold text-gov-800 underline underline-offset-2" onClick={baselinePreset}>Restore baseline</button></div>
      <div className="mb-3 rounded-lg bg-slate-50 p-3"><p className="mb-1.5 text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Quick scenarios</p><div className="flex flex-wrap gap-1.5"><PresetButton label="Baseline" onClick={baselinePreset} /><PresetButton label="Schedule pressure" onClick={progressPreset} /><PresetButton label="Budget pressure" onClick={budgetPreset} /><PresetButton label="Delivery pressure" onClick={deliveryPreset} /></div></div>

      <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 px-4">
        {SECTIONS.map((section, index) => <details key={section.title} open={index === 0} className="group py-1">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-2.5 text-xs font-extrabold text-slate-900"><span>{section.title}</span><span className="text-[10px] font-semibold text-slate-500">{section.fields.filter((field) => values[field.key] !== startingValues[field.key]).length} changed <span className="ml-1 inline-block transition-transform group-open:rotate-180">⌄</span></span></summary>
          <div className="space-y-3 pb-3">{section.fields.map((field) => <div key={field.key}>
            <label htmlFor={`scenario-${field.key}`} className="flex items-baseline justify-between gap-3 text-xs"><span className="font-medium text-slate-700">{field.label}</span><strong className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] tabular-nums text-slate-900">{formatValue(values[field.key])} {field.unit}</strong></label>
            <input id={`scenario-${field.key}`} type="range" min={field.min} max={field.max} step={field.step} value={values[field.key]} onChange={(event) => setValues((current) => ({ ...current, [field.key]: Number(event.target.value) }))} className="mt-1 w-full accent-gov-800" />
            <div className="flex justify-between text-[11px] font-medium text-slate-600"><span>{field.min}</span><span>{field.max} {field.unit}</span></div>
          </div>)}</div>
        </details>)}
      </div>
      <button type="submit" className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-gov-900 px-4 py-2.5 text-xs font-extrabold text-white shadow-md shadow-gov-900/20 transition hover:bg-gov-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gov-700 focus-visible:ring-offset-2">Calculate scenario risk <span aria-hidden>→</span></button>
      <p className="mt-2 text-[10px] leading-relaxed text-slate-500">Illustrative rule-based estimate, not an ML prediction or calibrated probability.</p>
    </form>

    <div className="space-y-3">
      <section className="rounded-xl border border-slate-200 bg-slate-50 p-3"><div className="mb-2 flex flex-wrap items-start justify-between gap-2"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-slate-500">Current project baseline</p><h3 className="mt-0.5 text-sm font-black text-slate-950">{baseline?.name ?? "Selected project"}</h3></div><span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-500">{baseline?.scenarioInputs?.snapshotDate ?? "Date unavailable"}</span></div>
        <div className="mb-3 flex flex-wrap gap-3"><label className="text-xs font-bold text-slate-600">Target<select value={target} onChange={(event) => setTarget(event.target.value)} className="field mt-1"><option value="delay">Schedule delay</option><option value="cost">Cost overrun</option></select></label><label className="text-xs font-bold text-slate-600">Horizon<select value={horizon} onChange={(event) => setHorizon(event.target.value)} className="field mt-1"><option value="6">6 months</option><option value="12">12 months</option></select></label></div>
        {Number.isFinite(selectedRisk) ? <RiskMeter risk={selectedRisk} band={band(selectedRisk)} label={`${target === "delay" ? "Schedule" : "Cost overrun"} · ${horizon}-month baseline`} /> : <p className="text-sm text-slate-500">Baseline risk score unavailable.</p>}
      </section>

      {reportScores ? <section className="overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-900 shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 p-3"><p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-gov-800">Submitted scenario report</p><h3 className="mt-0.5 text-lg font-black text-slate-950">{staleReport ? "Report ready · newer edits not submitted" : "Scenario risk outlook"}</h3><p className="mt-1 text-xs text-slate-600">{reportChanged.length} parameter{reportChanged.length === 1 ? "" : "s"} changed.</p></div>
        <div className="space-y-3 p-3">
          <div className="grid grid-cols-2 gap-2"><HeadlineMeter label="Baseline headline" value={baseline?.risk ?? baselineScores.headline} /><HeadlineMeter label="Scenario headline" value={reportScores.headline} /></div>
          <div className={`rounded-lg border p-3 ${reportScores.headline > (baseline?.risk ?? baselineScores.headline) + 0.05 ? "border-rose-200 bg-rose-50" : reportScores.headline < (baseline?.risk ?? baselineScores.headline) - 0.05 ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50"}`}><p className="text-xs font-bold">{reportScores.headline > (baseline?.risk ?? baselineScores.headline) + 0.05 ? "Risk elevation" : reportScores.headline < (baseline?.risk ?? baselineScores.headline) - 0.05 ? "Risk reduction" : "No material headline change"}</p><p className="mt-0.5 text-lg font-black tabular-nums">{reportScores.headline > (baseline?.risk ?? baselineScores.headline) ? "+" : ""}{(reportScores.headline - (baseline?.risk ?? baselineScores.headline)).toFixed(1)} index points <span className="text-xs font-semibold text-slate-600">· {band(reportScores.headline) === band(baseline?.risk ?? baselineScores.headline) ? `${bandLabel(reportScores.headline)} level unchanged` : `${bandLabel(baseline?.risk ?? baselineScores.headline)} → ${bandLabel(reportScores.headline)}`}</span></p><p className="mt-0.5 text-[10px] text-slate-600">Index points, not probability percentage points.</p></div>
          <div><p className="mb-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-600">Updated forecasts</p><div className="grid grid-cols-2 gap-1.5">{FORECASTS.map(([key, label, baselineKey]) => <ScoreTile key={key} label={label} before={baseline?.[baselineKey] ?? baselineScores[key]} after={reportScores[key]} />)}</div></div>
          <div className="grid gap-2 sm:grid-cols-2"><div className="rounded-lg border border-rose-200 bg-rose-50 p-2.5"><h4 className="text-xs font-extrabold text-rose-800">Top pressure drivers</h4>{reportOutliers.filter((field) => field.effect > 0.05).slice(0, 4).length ? <ul className="mt-1.5 space-y-1">{reportOutliers.filter((field) => field.effect > 0.05).slice(0, 4).map((field) => <li key={field.key} className="flex justify-between gap-2 text-[10px]"><span className="text-slate-700">{field.label}</span><strong className="shrink-0 tabular-nums text-rose-800">+{field.effect.toFixed(1)}</strong></li>)}</ul> : <p className="mt-1 text-[10px] text-slate-600">No changed input added pressure.</p>}</div><div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5"><h4 className="text-xs font-extrabold text-emerald-800">Protective changes</h4>{reportOutliers.filter((field) => field.effect < -0.05).slice(0, 4).length ? <ul className="mt-1.5 space-y-1">{reportOutliers.filter((field) => field.effect < -0.05).slice(0, 4).map((field) => <li key={field.key} className="flex justify-between gap-2 text-[10px]"><span className="text-slate-700">{field.label}</span><strong className="shrink-0 tabular-nums text-emerald-800">{field.effect.toFixed(1)}</strong></li>)}</ul> : <p className="mt-1 text-[10px] text-slate-600">No changed input lowered risk.</p>}</div></div>
          {reportChanged.length > 0 && <details className="rounded-lg border border-slate-200 bg-white p-2.5"><summary className="cursor-pointer text-xs font-bold">Review {reportChanged.length} submitted changes</summary><div className="mt-2 divide-y divide-slate-200">{reportChanged.map((field) => <div key={field.key} className="flex flex-wrap justify-between gap-x-3 gap-y-1 py-1.5 text-[10px]"><span className="text-slate-600">{field.label}</span><strong className="tabular-nums">{formatValue(field.base)} → {formatValue(submitted[field.key])} {field.unit}</strong></div>)}</div></details>}
        </div>
      </section> : <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gov-50 text-2xl text-gov-800" aria-hidden>↗</div><h3 className="mt-3 text-lg font-black text-slate-900">Your report will appear here</h3><p className="mx-auto mt-1 max-w-sm text-sm text-slate-600">Adjust any of the project controls and submit the scenario to see all four forecasts, risk elevation, and the strongest drivers.</p></section>}
      <div className="rounded-xl border border-slate-200 bg-white p-4"><h3 className="font-bold text-slate-900">Fixed project context</h3><p className="mt-1 text-xs text-slate-500">Project identity and location stay tied to the selected baseline.</p><div className="mt-3 flex flex-wrap gap-2">{[baseline?.state, baseline?.sector, baseline?.agency, baseline?.scenarioInputs?.climateRegion, baseline?.scenarioInputs?.unionTerritory ? "Union territory" : "State"].filter(Boolean).map((item) => <span key={item} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">{item}</span>)}</div></div>
    </div>
  </div>;
}
