"use client";
import { useState } from "react";
import Link from "next/link";
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getPortfolio, getProjects } from "@/lib/api";
import useData from "@/lib/useData";
import { Empty, ErrorState, Loading, RiskBadge, Section } from "@/components/ui";
import { band as riskBand, HEX, THRESHOLDS } from "@/lib/risk";
import { CHART, CHART_TICK, CHART_TOOLTIP } from "@/lib/chartTheme";
import CategoryTick from "@/components/charts/CategoryTick";

const Stat = ({ label, value, sub }) => (
  <div className="group min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
    <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">{label}</p>
    <p className="mt-2 text-3xl font-bold tabular-nums text-slate-950">{value}</p>
    {sub && <p className="mt-1 text-xs leading-relaxed text-ink-500">{sub}</p>}
  </div>
);

const average = (values) => {
  const valid = values.filter(Number.isFinite);
  return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : null;
};

export default function Dashboard() {
  const { data, error, loading, retry } = useData(() => Promise.all([getPortfolio(), getProjects()]));
  const [warningLevel, setWarningLevel] = useState("ALL");
  if (loading) return <Loading rows={8} />;
  if (error) return <ErrorState message={error} retry={retry} />;
  const [p, projects] = data;
  if (!projects.length) return <>
    <h1 className="text-3xl font-bold">Infrastructure portfolio</h1>
    <p className="text-ink-500 mt-1 mb-8">Illustrative schedule and cost risk scores across 6- and 12-month horizons.</p>
    <Empty message="No forecast data is available yet." action={<Link href="/settings" className="btn-primary inline-flex mt-4">Add forecast data</Link>} />
  </>;
  const allAlerts = [...projects].filter((x) => x.earlyWarningActive).sort((a, b) => b.risk - a.risk);
  const alerts = allAlerts.filter((project) => warningLevel === "ALL" || project.band === warningLevel).slice(0, 6);
  const horizonStats = ["6", "12"].map((horizon) => {
    const schedule = average(projects.map((project) => project[`delayRisk${horizon}m`]));
    const cost = average(projects.map((project) => project[`costRisk${horizon}m`]));
    return { horizon, schedule, cost, mean: average([schedule, cost]), count: projects.filter((project) => Number.isFinite(project[`delayRisk${horizon}m`]) || Number.isFinite(project[`costRisk${horizon}m`])).length };
  });

  return (
    <>
      <header className="relative isolate overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-emerald-50 p-5 shadow-sm sm:p-7">
        <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-20 -z-10 h-64 w-64 rounded-full bg-emerald-100/70 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Infrastructure portfolio</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">Illustrative schedule and cost risk scores across 6- and 12-month horizons.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/risk-radar" className="btn-primary rounded-lg shadow-sm">Open risk radar</Link>
            <Link href="/project-map" className="btn-ghost rounded-lg bg-white/80">India map</Link>
            <Link href="/reports" className="btn-ghost rounded-lg bg-white/80">Reports &amp; exports</Link>
            <Link href="/settings" className="btn-ghost rounded-lg bg-white/80">Update data</Link>
          </div>
        </div>
      </header>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <Stat label="Projects monitored" value={p.total} />
        <Stat label="Severe risk" value={p.critical} sub="Highest risk index above 60%" />
        <Stat label="Elevated risk" value={p.watch} sub="Highest risk index above 30% to 60%" />
        <Stat label="Stable outlook" value={p.stable} sub="Highest risk index up to 30%" />
        <Stat label="Warnings ahead of deadline" value={p.warnings ?? 0} sub="Based on risk index and deadline context" />
      </div>

      <Section title="Portfolio risk distribution">
        <div role="img" aria-label={`${p.stable} stable, ${p.watch} elevated, and ${p.critical} severe projects`} className="flex h-9 overflow-hidden rounded-full bg-slate-100 shadow-inner">
          {[["GREEN", p.stable, "bg-risk-green"], ["AMBER", p.watch, "bg-risk-amber"], ["RED", p.critical, "bg-risk-red"]].map(([b, n, c]) => (
            <div key={b} className={`${c} grid place-items-center text-white text-xs font-bold transition-[width] duration-500`} style={{ width: `${p.total ? (n / p.total) * 100 : 0}%` }}>
              {n > 0 && n}
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium text-ink-700">
          <span>Stable, up to {THRESHOLDS.amber}%: {p.stable}</span>
          <span>Elevated, above {THRESHOLDS.amber}% to {THRESHOLDS.red}%: {p.watch}</span>
          <span>Severe, above {THRESHOLDS.red}%: {p.critical}</span>
        </div>
      </Section>

      <div className="grid gap-6">
        <Section title="Risk by sector" hint="Mean headline risk index. Dashed guides show the risk-band cutoffs.">
          <div className="overflow-x-auto">
          <div className="h-[370px] min-w-[900px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[...p.sectors].sort((a, b) => b.risk - a.risk)} margin={{ top: 10, right: 8, bottom: 8, left: 0 }}>
                <CartesianGrid horizontal stroke={CHART.grid} strokeDasharray="2 3" vertical={false} />
                <XAxis dataKey="sector" type="category" interval={0} height={62} tick={<CategoryTick />} tickLine={false} axisLine={{ stroke: CHART.axis }} />
                <YAxis type="number" domain={[0, 100]} ticks={[0, 20, 40, 60, 80, 100]} tickFormatter={(value) => `${value}%`} tick={CHART_TICK} tickLine={false} axisLine={false} width={46} />
                <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, "Mean headline risk"]} labelFormatter={(sector) => `${sector} Â· ${p.sectors.find((row) => row.sector === sector)?.count ?? 0} projects`} contentStyle={CHART_TOOLTIP} cursor={{ fill: "#f4f6f7" }} />
                <ReferenceLine y={THRESHOLDS.amber} stroke="#9aa4ac" strokeDasharray="3 4" />
                <ReferenceLine y={THRESHOLDS.red} stroke="#9aa4ac" strokeDasharray="3 4" />
                <Bar dataKey="risk" name="Mean headline risk" barSize={28} maxBarSize={34} isAnimationActive={false}>
                  {[...p.sectors].sort((a, b) => b.risk - a.risk).map((sector) => <Cell key={sector.sector} fill={HEX[riskBand(sector.risk)] ?? CHART.primary} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs text-ink-500"><span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-risk-green" />Stable â‰¤ {THRESHOLDS.amber}%</span><span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-risk-amber" />Elevated â‰¤ {THRESHOLDS.red}%</span><span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-risk-red" />Severe &gt; {THRESHOLDS.red}%</span></div>
        </Section>

        <Section title="Risk index horizons" hint="Average schedule and cost forecasts for each outlook period.">
          <div className="grid gap-3 sm:grid-cols-2">
            {horizonStats.map(({ horizon, schedule, cost, mean, count }) => <article key={horizon} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-start justify-between gap-2"><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Next {horizon} months</p><p className="mt-1 text-2xl font-black tabular-nums text-slate-950">{mean == null ? "Unavailable" : `${mean.toFixed(1)}%`}</p><p className="text-xs text-slate-500">mean schedule and cost index</p></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">{count} projects</span></div>
              <div className="mt-4 space-y-3">
                {[["Schedule", schedule], ["Cost overrun", cost]].map(([label, score]) => <div key={label}>
                  <div className="mb-1 flex justify-between text-xs"><span className="font-medium text-slate-600">{label}</span><strong className="tabular-nums text-slate-800">{score == null ? "Unavailable" : `${score.toFixed(1)}%`}</strong></div>
                  <div role="meter" aria-label={`${label} risk at ${horizon} months${score == null ? ": unavailable" : `: ${score.toFixed(1)} percent`}`} aria-valuemin="0" aria-valuemax="100" aria-valuenow={score ?? undefined} className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full transition-[width]" style={{ width: `${score ?? 0}%`, backgroundColor: score == null ? "#cbd5e1" : HEX[riskBand(score)] }} /></div>
                </div>)}
              </div>
              <Link href="/risk-radar" className="mt-4 inline-flex text-xs font-bold text-gov-800 hover:underline">Explore in Risk Radar <span className="ml-1" aria-hidden>→</span></Link>
            </article>)}
          </div>
        </Section>
      </div>

      <Section title="Early-warning list" hint="Projects are ordered by the highest of the four risk index scores."
        right={<Link href="/early-warning" className="text-sm text-gov-800 font-semibold hover:underline">All early warnings</Link>}>
        <div className="mb-3 flex flex-wrap gap-2" aria-label="Filter early warnings by risk level">
          {[["ALL", "All warnings"], ["RED", "Severe"], ["AMBER", "Elevated"]].map(([key, label]) => {
            const count = key === "ALL" ? allAlerts.length : allAlerts.filter((project) => project.band === key).length;
            const selected = warningLevel === key;
            return <button key={key} type="button" onClick={() => setWarningLevel(key)} aria-pressed={selected} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${selected ? "border-gov-800 bg-gov-800 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-gov-700"}`}>{label} <span className={selected ? "text-white/75" : "text-slate-400"}>{count}</span></button>;
          })}
        </div>
        <ul className="border-t border-ink-200">
          {alerts.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center gap-4 py-3 border-b border-ink-200">
              <Link href={`/projects/${a.id}`} className="font-medium text-gov-800 hover:underline min-w-[240px]">{a.name}</Link>
              <span className="text-sm text-ink-500">{a.state} Â· {a.sector} Â· {a.warningType || "Not classified"}</span>
              <RiskBadge band={a.band} />
              <span className="text-sm font-semibold ml-auto tabular-nums">{a.risk.toFixed(2)}%</span>
            </li>
          ))}
        </ul>
        {!alerts.length && <p className="py-5 text-sm text-ink-500">No {warningLevel === "RED" ? "severe" : "elevated"} warnings in this portfolio.</p>}
      </Section>

    </>
  );
}
