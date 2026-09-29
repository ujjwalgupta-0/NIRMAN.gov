"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { getProjects } from "@/lib/api";
import useData from "@/lib/useData";
import WhatIfSimulator from "@/components/simulator/WhatIfSimulator";
import { Empty, ErrorState, Loading } from "@/components/ui";

export default function SimulatorPage() {
  const { data = [], error, loading, retry } = useData(getProjects);
  const [projectId, setProjectId] = useState("");
  const project = useMemo(() => data.find((item) => String(item.id) === projectId) || data[0], [data, projectId]);

  if (loading) return <Loading rows={7} />;
  if (error) return <ErrorState message={error} retry={retry} />;
  if (!data.length) return <><h1 className="text-2xl font-bold">What-if simulator</h1><p className="text-ink-500 mt-1 mb-5">Explore possible changes to project conditions.</p><Empty message="Add forecast data to start a scenario review." /></>;

  return <>
    <header className="mb-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gov-700">Scenario planning</p>
      <h1 className="text-2xl font-bold mt-1">What-if simulator</h1>
      <p className="text-xs text-ink-500 mt-1 max-w-3xl">Adjust project assumptions and submit to compare the illustrative risk index.</p>
    </header>
    <div className="border border-ink-200 bg-white p-3 mb-4 flex flex-wrap items-center justify-between gap-3">
      <label className="text-xs text-ink-600" htmlFor="scenario-project">Project<select id="scenario-project" value={project?.id ?? ""} onChange={(event) => setProjectId(event.target.value)} className="block mt-1 w-full sm:min-w-[24rem] border border-ink-200 bg-white px-3 py-2 text-xs text-ink-900">
        {data.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.state} · {item.sector}</option>)}
      </select></label>
      {project && <Link href={`/projects/${project.id}`} className="text-sm text-gov-800 underline underline-offset-2">View project risk index</Link>}
    </div>
    {project && <WhatIfSimulator key={project.id} baseline={project} />}
  </>;
}
