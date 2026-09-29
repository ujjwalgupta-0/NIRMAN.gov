"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { getProjects } from "@/lib/api";
import useData from "@/lib/useData";
import { Empty, ErrorState, Loading, RiskBadge, Section } from "@/components/ui";
import { band, HEX, THRESHOLDS } from "@/lib/risk";

const TARGETS = {
  delay: { label: "Delay", fields: { 6: "delayRisk6m", 12: "delayRisk12m" } },
  cost: { label: "Cost overrun", fields: { 6: "costRisk6m", 12: "costRisk12m" } }
};

function Select({ label, value, onChange, children }) {
  return <label className="text-sm text-ink-600">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="block w-full sm:w-auto mt-1 border border-ink-200 bg-white px-3 py-2 text-ink-900">{children}</select></label>;
}

export default function RiskRadar() {
  const { data = [], error, loading, retry } = useData(getProjects);
  const [target, setTarget] = useState("delay");
  const [horizon, setHorizon] = useState("6");
  const [selectedBand, setSelectedBand] = useState("ALL");
  const [sector, setSector] = useState("ALL");
  const [query, setQuery] = useState("");

  const field = TARGETS[target].fields[horizon];
  const sectors = useMemo(() => [...new Set(data.map((project) => project.sector).filter(Boolean))].sort(), [data]);
  const scored = data.filter((project) => Number.isFinite(project[field]));
  const ranked = useMemo(() => data
    .filter((project) => Number.isFinite(project[field]))
    .map((project) => ({ ...project, selectedRisk: project[field], selectedBand: band(project[field]) }))
    .filter((project) => selectedBand === "ALL" || project.selectedBand === selectedBand)
    .filter((project) => sector === "ALL" || project.sector === sector)
    .filter((project) => `${project.name} ${project.state} ${project.sector}`.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => b.selectedRisk - a.selectedRisk), [data, field, selectedBand, sector, query]);
  const counts = useMemo(() => Object.fromEntries(["RED", "AMBER", "GREEN"].map((key) => [key, data.filter((project) => Number.isFinite(project[field]) && band(project[field]) === key).length])), [data, field]);
  const mean = scored.length ? scored.reduce((sum, project) => sum + project[field], 0) / scored.length : null;
  const peak = scored.length ? Math.max(...scored.map((project) => project[field])) : null;

  if (loading) return <Loading rows={8} />;
  if (error) return <ErrorState message={error} retry={retry} />;
  if (!data.length) return <><h1 className="text-3xl font-bold">Risk radar</h1><p className="text-ink-500 mt-1 mb-8">Explore project forecasts by outcome and horizon.</p><Empty message="Add forecast data to view the risk radar." /></>;

  return <>
    <header className="mb-7">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gov-700">Portfolio intelligence</p>
      <h1 className="text-3xl font-bold mt-2">Risk radar</h1>
      <p className="text-ink-500 mt-2 max-w-3xl">Rank projects by illustrative risk index. Choose an outcome and horizon to compare schedule and cost pressure.</p>
    </header>

    <div className="border border-ink-200 bg-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-end gap-4">
      <Select label="Forecast target" value={target} onChange={setTarget}><option value="delay">Schedule delay</option><option value="cost">Cost overrun</option></Select>
      <Select label="Risk horizon" value={horizon} onChange={setHorizon}><option value="6">Next 6 months</option><option value="12">Next 12 months</option></Select>
      <p className="sm:ml-auto text-xs text-ink-500 pb-2">Illustrative risk index</p>
    </div>

    <Section title={`${TARGETS[target].label} outlook · ${horizon} months`} hint="Risk levels: stable ≤30%, elevated >30–60%, severe >60%.">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="border border-ink-200 p-4"><p className="text-xs uppercase tracking-wide text-ink-500">Projects scored</p><p className="text-3xl font-bold mt-2">{scored.length}</p><p className="mt-1 text-xs text-ink-500">with this risk index</p></div>
        {[["RED", "Severe"], ["AMBER", "Elevated"], ["GREEN", "Stable"]].map(([key, label]) => <button key={key} onClick={() => setSelectedBand(selectedBand === key ? "ALL" : key)} aria-pressed={selectedBand === key} className={`text-left border p-4 transition-colors ${selectedBand === key ? "border-gov-800 ring-1 ring-gov-800" : "border-ink-200 hover:border-ink-400"}`}>
          <div className="flex justify-between items-center"><span className="text-xs uppercase tracking-wide text-ink-500">{label}</span><RiskBadge band={key} /></div><p className="text-3xl font-bold mt-2">{counts[key]}</p><p className="text-xs text-ink-500 mt-1">projects · click to filter</p>
        </button>)}
      </div>
      <div className="mt-3 border border-ink-200 bg-ink-50 px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <span className="text-ink-500">Portfolio average</span><strong>{mean == null ? "Unavailable" : `${mean.toFixed(1)}%`}</strong>
        <span className="text-ink-300">|</span><span className="text-ink-500">Highest risk index</span><strong>{peak == null ? "Unavailable" : `${peak.toFixed(1)}%`}</strong>
        <button className="ml-auto text-gov-800 underline underline-offset-2" onClick={() => setSelectedBand("ALL")}>Clear band filter</button>
      </div>
    </Section>

    <Section title="Project ranking" hint={`${ranked.length} projects · highest risk index first`}>
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <label className="sr-only" htmlFor="radar-search">Search projects</label><input id="radar-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search project, state or sector" className="border border-ink-200 px-3 py-2 text-sm flex-1" />
        <Select label="Sector" value={sector} onChange={setSector}><option value="ALL">All sectors</option>{sectors.map((item) => <option key={item}>{item}</option>)}</Select>
      </div>
      <div className="overflow-x-auto border border-ink-200">
        <table className="w-full min-w-[680px] text-sm">
          <thead className="bg-ink-50 text-left text-xs uppercase tracking-wide text-ink-500"><tr><th className="p-3">Rank / project</th><th className="p-3">State · sector</th><th className="p-3">Risk index</th><th className="p-3">Risk level</th></tr></thead>
          <tbody>{ranked.map((project, index) => <tr key={project.id} className="border-t border-ink-200 hover:bg-ink-50">
            <td className="p-3"><span className="inline-block w-8 text-ink-400">{String(index + 1).padStart(2, "0")}</span><Link href={`/projects/${encodeURIComponent(project.id)}?riskTarget=${target}&riskHorizon=${horizon}`} className="font-semibold text-gov-800 hover:underline">{project.name}</Link></td>
            <td className="p-3 text-ink-600">{project.state}<span className="block text-xs text-ink-500">{project.sector}</span></td>
            <td className="p-3 w-[28%]"><div className="flex items-center gap-3"><span className="font-bold tabular-nums w-14">{project.selectedRisk.toFixed(1)}%</span><div className="h-2 bg-ink-100 flex-1"><div className="h-full" style={{ width: `${project.selectedRisk}%`, backgroundColor: HEX[project.selectedBand] }} /></div></div></td>
            <td className="p-3"><RiskBadge band={project.selectedBand} /></td>
          </tr>)}
          {!ranked.length && <tr><td colSpan="4" className="p-8 text-center text-ink-500">No projects match those filters.</td></tr>}</tbody>
        </table>
      </div>
      <p className="text-xs text-ink-500 mt-3">For the selected risk index: elevated above {THRESHOLDS.amber}%; severe above {THRESHOLDS.red}%. The project page’s headline level is the average of the four risk index scores.</p>
    </Section>
  </>;
}
