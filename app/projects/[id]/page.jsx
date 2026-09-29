"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getProject } from "@/lib/api";
import useData from "@/lib/useData";
import { ErrorState, Loading, RiskBadge } from "@/components/ui";
import { band, THRESHOLDS } from "@/lib/risk";
import WhatIfSimulator from "@/components/simulator/WhatIfSimulator";
import RiskMeter from "@/components/risk/RiskMeter";
import RiskFactors from "@/components/risk/RiskFactors";

const FORECASTS = [
  ["delayRisk6m", "Schedule · 6 months"],
  ["delayRisk12m", "Schedule · 12 months"],
  ["costRisk6m", "Cost · 6 months"],
  ["costRisk12m", "Cost · 12 months"]
];

function CompactSection({ title, hint, children }) {
  return <section className="mt-6 border-t border-ink-200 pt-4 first:mt-0 first:border-0 first:pt-0">
    <div className="mb-3"><h2 className="text-base font-bold">{title}</h2>{hint && <p className="mt-0.5 text-xs text-ink-500">{hint}</p>}</div>
    {children}
  </section>;
}

function ProjectPageContent({ params }) {
  const searchParams = useSearchParams();
  const { id } = params;
  const { data: project, error, loading, retry } = useData(() => getProject(id), [id]);
  if (loading) return <Loading rows={8} />;
  if (error) return <ErrorState message={error} retry={retry} />;

  const riskTarget = searchParams.get("riskTarget");
  const riskHorizon = searchParams.get("riskHorizon");
  const forecastKey = `${riskTarget === "delay" ? "delayRisk" : "costRisk"}${riskHorizon}m`;
  const hasForecastContext = ["delay", "cost"].includes(riskTarget) && ["6", "12"].includes(riskHorizon) && Number.isFinite(project[forecastKey]);
  const headlineRisk = hasForecastContext ? project[forecastKey] : project.risk;
  const headlineBand = band(headlineRisk);
  const headlineLabel = hasForecastContext
    ? `${riskTarget === "delay" ? "Schedule" : "Cost overrun"} · ${riskHorizon}-month forecast`
    : "Overall project risk";

  const inputs = project.scenarioInputs ?? {};
  const value = (item, format = (entry) => entry) => item == null || item === "" ? null : format(item);
  const percent = (item) => value(item, (entry) => `${Number(entry).toLocaleString("en-IN", { maximumFractionDigits: 1 })}%`);
  const amount = (item) => value(item, (entry) => `₹${Number(entry).toLocaleString("en-IN", { maximumFractionDigits: 1 })} Cr`);
  const overview = [
    ["Location", [project.district, project.state].filter((item) => item && item !== "Unavailable").join(", ")],
    ["Sector / agency", [project.sector, project.agency].filter((item) => item && item !== "Unavailable").join(" · ")],
    ["Status / snapshot", [inputs.projectStatus, inputs.snapshotDate].filter(Boolean).join(" · ")],
    ["Progress", value(inputs.actualProgress ?? project.physical, (actual) => `${percent(actual)} actual${(inputs.plannedProgress ?? project.expectedPhysical) == null ? "" : ` / ${percent(inputs.plannedProgress ?? project.expectedPhysical)} planned`}`)],
    ["Budget", [percent(inputs.spendPct ?? project.financial) && `${percent(inputs.spendPct ?? project.financial)} spent`, amount(inputs.remainingBudget) && `${amount(inputs.remainingBudget)} remaining`].filter(Boolean).join(" · ")],
    ["Schedule", [value(inputs.monthsElapsed, (item) => `${item} months elapsed`), value(inputs.monthsToCompletion ?? project.months_to_planned_completion, (item) => `${item} months to completion`)].filter(Boolean).join(" · ")],
    ["Contractor", [inputs.contractorName, inputs.contractorId].filter(Boolean).join(" · ")],
    ["Quality / inspection", [value(inputs.qualityScore, (item) => `Quality ${item}/100`), value(inputs.inspectionScore, (item) => `Inspection ${item}/100`)].filter(Boolean).join(" · ")]
  ].filter(([, item]) => item != null && item !== "");
  const additionalOverview = [
    ["Milestones", [percent(inputs.milestoneCompletion) && `${percent(inputs.milestoneCompletion)} complete`, percent(inputs.milestoneOnTime) && `${percent(inputs.milestoneOnTime)} on time`].filter(Boolean).join(" · ")],
    ["Budget plan", [amount(inputs.plannedCost) && `${amount(inputs.plannedCost)} planned`, percent(inputs.costOverrunToDate) && `${percent(inputs.costOverrunToDate)} overrun`, amount(inputs.budgetExceeded) && `${amount(inputs.budgetExceeded)} exceeded`].filter(Boolean).join(" · ")],
    ["Materials / rework", [percent(inputs.materialPass) && `${percent(inputs.materialPass)} material pass rate`, percent(inputs.reworkPct) && `${percent(inputs.reworkPct)} rework`].filter(Boolean).join(" · ")],
    ["Contractor record", [value(inputs.contractorHistory, (item) => `${item} completed projects`), percent(inputs.contractorDelayRate) && `${percent(inputs.contractorDelayRate)} historical delay`, value(inputs.contractorDelayMonths, (item) => `${item} months average delay`), percent(inputs.contractorCostOverrunRate) && `${percent(inputs.contractorCostOverrunRate)} historical cost overrun`].filter(Boolean).join(" · ")],
    ["Site conditions", [inputs.climateRegion && inputs.climateRegion !== "Unavailable" ? inputs.climateRegion : null, percent(inputs.rainfallPct) && `${percent(inputs.rainfallPct)} of normal rainfall`, value(inputs.monsoonDaysThisMonth, (item) => `${item} monsoon days`)].filter(Boolean).join(" · ")],
    ["Forecast warning", project.warningType]
  ].filter(([, item]) => item != null && item !== "");

  return <div className="mx-auto max-w-6xl">
    <header className="border-b border-ink-200 pb-4">
     
      <h1 className="mt-1 text-2xl font-bold">{project.name}</h1>
      <div className="mt-2 flex flex-wrap items-center gap-2.5 text-xs text-ink-700">
        <span>{project.state}</span><span>{project.sector}</span><span>{project.agency}</span><RiskBadge band={headlineBand} />
      </div>
    </header>

    <CompactSection title="Project risk assessment" hint={hasForecastContext ? `Opened from Risk Radar: ${headlineLabel}.` : "Overall risk is the average of the four displayed forecasts."}>
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,520px)_minmax(0,1fr)]">
        <div className="space-y-3">
          <RiskMeter risk={headlineRisk} band={headlineBand} label={headlineLabel} />
          <section className="rounded-xl border border-ink-200 bg-white p-3">
            <h3 className="text-sm font-bold">Risk by outcome and horizon</h3>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {FORECASTS.map(([key, label]) => <div key={key} className="rounded-lg bg-slate-50 p-2">
                <p className="text-[10px] text-ink-500">{label}</p>
                <p className="mt-0.5 text-lg font-bold tabular-nums">{project[key] == null ? "Unavailable" : `${project[key].toFixed(1)}%`}</p>
              </div>)}
            </div>
            <p className="mt-2 text-[10px] text-ink-500">Stable ≤ {THRESHOLDS.amber}% · Elevated ≤ {THRESHOLDS.red}% · Severe above {THRESHOLDS.red}%.</p>
          </section>
          <section className="rounded-xl border border-ink-200 bg-white p-3">
            <h3 className="text-sm font-bold">Project overview</h3>
            <dl className="mt-1 grid grid-cols-2 gap-x-3">
              {overview.map(([label, content]) => <div key={label} className="border-b border-ink-100 py-1.5">
                <dt className="text-[10px] text-ink-500">{label}</dt>
                <dd className="text-xs font-semibold">{content}</dd>
              </div>)}
            </dl>
            {additionalOverview.length > 0 && <details className="mt-2 border-t border-ink-100 pt-2">
              <summary className="cursor-pointer text-xs font-bold text-gov-800">Additional project details <span className="ml-1 font-medium text-ink-500">({additionalOverview.length})</span></summary>
              <dl className="mt-2 grid gap-x-3 sm:grid-cols-2">
                {additionalOverview.map(([label, content]) => <div key={label} className="border-b border-ink-100 py-1.5 last:border-0">
                  <dt className="text-[10px] text-ink-500">{label}</dt>
                  <dd className="text-xs font-semibold">{content}</dd>
                </div>)}
              </dl>
            </details>}
          </section>
        </div>
        <div className="min-w-0 rounded-xl border border-ink-200 bg-white p-3 sm:p-4">
          <RiskFactors project={project} />
        </div>
      </div>
    </CompactSection>

    <CompactSection title="What-if scenario" hint="Adjust the assumptions and submit to compare the updated outlook.">
      <WhatIfSimulator key={project.id} baseline={project} />
    </CompactSection>
    <CompactSection title="How this index is built">
      <p className="max-w-3xl text-xs leading-relaxed text-ink-700">The index combines schedule slippage, progress gaps, budget pressure, quality, milestones, contractor history, and seasonal pressure into separate schedule and cost indices. Scores are rule-based examples, not calibrated ML probabilities.</p>
    </CompactSection>
  </div>;
}

export default function ProjectPage({ params }) {
  return <Suspense fallback={<Loading rows={8} />}><ProjectPageContent params={params} /></Suspense>;
}
