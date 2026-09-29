"use client";
import Link from "next/link";
import { getProjects } from "@/lib/api";
import useData from "@/lib/useData";
import { Empty, ErrorState, Loading, RiskBadge } from "@/components/ui";

export default function EarlyWarnings() {
  const { data, error, loading, retry } = useData(getProjects);
  if (loading) return <Loading rows={6} />;
  if (error) return <ErrorState message={error} retry={retry} />;
  const active = data.filter((p) => p.band !== "GREEN").sort((a, b) => b.risk - a.risk);

  return (
  <>
      <h1 className="text-3xl font-bold">Early warnings</h1>
      <p className="text-ink-500 mt-1 mb-8">Projects in the elevated and severe risk levels. Deadline context distinguishes overdue work from upcoming milestones.</p>
      {active.length === 0 ? (
        <Empty message={data.length ? "No projects fall in the elevated or severe forecast levels." : "Add forecast data to view early warnings."} action={!data.length ? <Link href="/settings" className="btn-primary inline-flex mt-4">Add forecast data</Link> : null} />
      ) : (
        <ul className="border-t border-ink-200">
          {active.map((p) => (
            <li key={p.id} className="py-4 border-b border-ink-200 flex flex-wrap items-center gap-4">
              <span className="min-w-[260px]">
                <Link href={`/projects/${p.id}`} className="font-medium text-gov-800 hover:underline">{p.name}</Link>
                <span className="block text-sm text-ink-500">{p.state} · {p.sector} · {p.agency}</span>
              </span>
              <RiskBadge band={p.band} />
              <span className="text-sm text-ink-700">{p.warningType || "Deadline context unavailable"}</span>
              <span className="text-xl font-semibold ml-auto tabular-nums">{p.risk.toFixed(2)}%</span>
              <Link href={`/projects/${p.id}`} className="btn-ghost">Open forecasts</Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
