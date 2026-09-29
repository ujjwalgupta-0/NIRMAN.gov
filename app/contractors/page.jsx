"use client";
import { useMemo, useState } from "react";
import { Empty, ErrorState, Loading, Section } from "@/components/ui";
import useData from "@/lib/useData";
import { getContractorPerformance } from "@/lib/contractors";

const pct = (value) => value == null ? "—" : `${value.toFixed(0)}%`;
const number = (value, suffix = "") => value == null ? "—" : `${value.toFixed(1)}${suffix}`;

export default function ContractorsPage() {
  const { data = [], error, loading, retry } = useData(getContractorPerformance);
  const [query, setQuery] = useState("");
  const shown = useMemo(() => data.filter((row) => `${row.name} ${row.id}`.toLowerCase().includes(query.trim().toLowerCase())), [data, query]);
  const ranked = data.filter((row) => row.pairedCount >= 3 && row.favorableRate != null);

  return <>
    <h1 className="text-3xl font-bold">Contractor performance</h1>
    <p className="mb-8 mt-1 text-ink-500">Compare contractors by completed project outcomes. Higher on-time and within-budget rates indicate stronger historical performance.</p>
    <Section title="Strongest historical outcomes" hint="Ranked by the share of completed projects delivered both on time and within budget. At least 3 complete records are required for this shortlist.">
      {loading && <Loading rows={3} />}
      {error && <ErrorState message={error} retry={retry} />}
      {!loading && !error && (ranked.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{ranked.slice(0, 3).map((row, index) => <article key={row.id} className="border border-ink-200 p-5"><p className="text-xs font-semibold uppercase tracking-wide text-ink-500">{index === 0 ? "Best observed rate" : `Rank ${index + 1}`}</p><h2 className="mt-2 text-lg font-bold">{row.name}</h2><p className="mt-1 text-sm text-ink-500">{row.pairedCount} completed projects with both outcome measures</p><p className="mt-4 text-3xl font-semibold text-risk-green">{pct(row.favorableRate)}</p><p className="text-xs text-ink-500">on time and within budget</p></article>)}</div> : <Empty message="No contractors have enough completed records for a comparison yet." />)}
    </Section>
    <Section title="All contractors" hint="Rates use completed contracts only. Average delay and cost overrun include all completed records with that measure.">
      <label className="mb-4 block text-sm text-ink-600">Find contractor<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Contractor name or ID" className="field mt-1 max-w-sm" /></label>
      {loading ? <Loading rows={8} /> : error ? null : shown.length ? <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead><tr className="border-b border-ink-200 text-xs text-ink-500"><th className="py-3 pr-4">Contractor</th><th className="py-3 pr-4">Completed</th><th className="py-3 pr-4">On time</th><th className="py-3 pr-4">Within budget</th><th className="py-3 pr-4">Both</th><th className="py-3 pr-4">Avg. delay</th><th className="py-3">Avg. cost overrun</th></tr></thead><tbody>{shown.map((row) => <tr key={row.id} className="border-b border-ink-100"><td className="py-3 pr-4"><strong>{row.name}</strong><span className="ml-2 text-xs text-ink-500">{row.id}</span></td><td className="py-3 pr-4">{row.completedCount}</td><td className="py-3 pr-4">{pct(row.onTimeRate)}</td><td className="py-3 pr-4">{pct(row.withinBudgetRate)}</td><td className="py-3 pr-4 font-semibold">{pct(row.favorableRate)}<span className="ml-1 text-xs font-normal text-ink-500">({row.pairedCount})</span></td><td className="py-3 pr-4">{number(row.averageDelay, " mo")}</td><td className="py-3">{number(row.averageOverrun, "%")}</td></tr>)}</tbody></table></div> : <Empty message="No contractors match that search." />}
      <p className="mt-4 text-xs text-ink-500">Small samples can produce unstable rates; compare these figures as examples rather than procurement evidence.</p>
    </Section>
  </>;
}
