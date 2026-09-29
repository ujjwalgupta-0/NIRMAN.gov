"use client";
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getProjects } from "@/lib/api";
import useData from "@/lib/useData";
import { CHART, CHART_TICK, CHART_TOOLTIP } from "@/lib/chartTheme";
import { band as riskBand, HEX, THRESHOLDS } from "@/lib/risk";
import { Empty, ErrorState, Loading, Section } from "@/components/ui";
import CategoryTick from "@/components/charts/CategoryTick";

const TARGETS = [
  { key: "delay", title: "Schedule risk", six: "delayRisk6m", twelve: "delayRisk12m" },
  { key: "cost", title: "Cost risk", six: "costRisk6m", twelve: "costRisk12m" }
];

function SectorChart({ rows, target }) {
  return <Section title={target.title + " by sector"} hint="Mean illustrative risk index across projects in each sector.">
    <div className="overflow-x-auto">
      <div className="h-[390px]" style={{ minWidth: Math.max(900, rows.length * 72) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 14, right: 8, bottom: 8, left: 0 }} barGap={3}>
            <CartesianGrid horizontal stroke={CHART.grid} strokeDasharray="2 3" vertical={false} />
            <XAxis dataKey="sector" type="category" interval={0} height={62} tick={<CategoryTick />} tickLine={false} axisLine={{ stroke: CHART.axis }} />
            <YAxis type="number" domain={[0, 100]} ticks={[0, 20, 40, 60, 80, 100]} tickFormatter={(value) => value + "%"} tick={CHART_TICK} tickLine={false} axisLine={false} width={46} />
            <Tooltip formatter={(value, name) => [Number(value).toFixed(1) + "%", name]} labelFormatter={(sector) => sector + " · " + (rows.find((row) => row.sector === sector)?.projects ?? 0) + " projects"} contentStyle={CHART_TOOLTIP} cursor={{ fill: "#f4f6f7" }} />
            <ReferenceLine y={THRESHOLDS.amber} stroke="#9aa4ac" strokeDasharray="3 4" />
            <ReferenceLine y={THRESHOLDS.red} stroke="#9aa4ac" strokeDasharray="3 4" />
            <Bar dataKey={target.six} name="6 months" barSize={14} maxBarSize={18} isAnimationActive={false}>
              {rows.map((row) => <Cell key={row.sector} fill={HEX[riskBand(row[target.six])] ?? CHART.secondary} fillOpacity={0.48} />)}
            </Bar>
            <Bar dataKey={target.twelve} name="12 months" barSize={14} maxBarSize={18} isAnimationActive={false}>
              {rows.map((row) => <Cell key={row.sector} fill={HEX[riskBand(row[target.twelve])] ?? CHART.primary} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink-500">
      <span>Risk:</span><span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-risk-green" />Stable</span><span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-risk-amber" />Elevated</span><span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-risk-red" />Severe</span>
      <span className="border-l border-ink-200 pl-3">Lighter = 6 months · solid = 12 months</span>
    </div>
  </Section>;
}

export default function Analytics() {
  const { data = [], error, loading, retry } = useData(getProjects);
  if (loading) return <Loading rows={8} />;
  if (error) return <ErrorState message={error} retry={retry} />;
  if (!data.length) return <><h1 className="text-3xl font-bold">Risk index analytics</h1><p className="mb-8 mt-1 text-ink-500">Compare schedule and cost risk across horizons.</p><Empty message="Add project data to view portfolio analytics." /></>;

  const sectors = [...new Set(data.map((project) => project.sector))].map((sector) => {
    const projects = data.filter((project) => project.sector === sector);
    const row = { sector, projects: projects.length };
    for (const target of TARGETS) {
      for (const field of [target.six, target.twelve]) {
        const values = projects.map((project) => project[field]).filter(Number.isFinite);
        row[field] = values.length ? +(values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1) : null;
      }
    }
    return row;
  }).sort((a, b) => (b.delayRisk12m ?? 0) - (a.delayRisk12m ?? 0));

  const warnings = [...new Set(data.map((project) => project.warningType || "Not classified"))].map((type) => ({
    type,
    count: data.filter((project) => (project.warningType || "Not classified") === type).length
  }));

  return <>
    <h1 className="text-3xl font-bold">Risk index analytics</h1>
    <p className="mt-1 text-ink-500">Sector averages across projects. Risk index scores are shown as percentages.</p>
    <div className="mt-8 grid gap-8">{TARGETS.map((target) => <SectorChart key={target.key} rows={sectors} target={target} />)}</div>
    <Section title="Snapshot status" hint="Project lifecycle status at the latest available snapshot.">
      <div className="grid gap-3 sm:grid-cols-3">{warnings.map(({ type, count }) => <div key={type} className="border border-ink-200 p-4"><p className="text-sm text-ink-500">{type}</p><p className="mt-1 text-2xl font-bold">{count}</p><p className="text-xs text-ink-500">projects</p></div>)}</div>
    </Section>
  </>;
}
