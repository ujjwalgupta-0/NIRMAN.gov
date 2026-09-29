"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Empty, RiskBadge } from "@/components/ui";

const PAGE = 12;
const unique = (list, key) => [...new Set(list.map((item) => item[key]).filter(Boolean))].sort();

export default function ProjectTable({ projects, initialQuery = "" }) {
  const [query, setQuery] = useState(initialQuery);
  const [state, setState] = useState("");
  const [sector, setSector] = useState("");
  const [bandFilter, setBandFilter] = useState("");
  const [warningFilter, setWarningFilter] = useState("");
  const [sort, setSort] = useState("risk");
  const [page, setPage] = useState(0);

  const rows = useMemo(() => {
    const term = query.toLowerCase();
    return projects.filter((project) =>
      (!term || [project.name, project.state, project.agency, project.sector].some((value) => String(value || "").toLowerCase().includes(term))) &&
      (!state || project.state === state) &&
      (!sector || project.sector === sector) &&
      (!bandFilter || project.band === bandFilter) &&
      (!warningFilter || Boolean(project.earlyWarningActive) === (warningFilter === "active"))
    ).sort((a, b) => (b[sort] ?? -1) - (a[sort] ?? -1));
  }, [projects, query, state, sector, bandFilter, warningFilter, sort]);

  const shown = rows.slice(page * PAGE, page * PAGE + PAGE);
  const clear = () => { setQuery(""); setState(""); setSector(""); setBandFilter(""); setWarningFilter(""); setPage(0); };
  const onFilter = (setter) => (event) => { setter(event.target.value); setPage(0); };

  return <div>
    <div className="mb-5 flex flex-wrap gap-3">
      <input value={query} onChange={onFilter(setQuery)} placeholder="Search project, state or agency" aria-label="Search projects" className="field max-w-xs" />
      <select value={state} onChange={onFilter(setState)} aria-label="Filter by state" className="field max-w-[180px]"><option value="">All states</option>{unique(projects, "state").map((item) => <option key={item}>{item}</option>)}</select>
      <select value={sector} onChange={onFilter(setSector)} aria-label="Filter by sector" className="field max-w-[180px]"><option value="">All sectors</option>{unique(projects, "sector").map((item) => <option key={item}>{item}</option>)}</select>
      <select value={bandFilter} onChange={onFilter(setBandFilter)} aria-label="Filter by risk level" className="field max-w-[150px]"><option value="">All levels</option><option value="RED">Severe</option><option value="AMBER">Elevated</option><option value="GREEN">Stable</option></select>
      <select value={warningFilter} onChange={onFilter(setWarningFilter)} aria-label="Filter by early warning" className="field max-w-[180px]"><option value="">All warnings</option><option value="active">Warning ahead</option><option value="inactive">No warning ahead</option></select>
      <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort projects" className="field max-w-[210px]"><option value="risk">Sort by highest risk index</option><option value="risk6m">Sort by 6-month risk index</option><option value="risk12m">Sort by 12-month risk index</option></select>
    </div>

    {shown.length === 0 ? <Empty message="No projects match your filters." action={<button className="btn-ghost mt-4" onClick={clear}>Clear filters</button>} /> :
      <div className="overflow-x-auto border border-ink-200"><table className="min-w-[900px] w-full text-sm">
        <thead className="bg-ink-100 text-left"><tr>{["Project", "State", "Sector", "Progress", "Overall risk", "Risk index - 6m", "Risk index - 12m", "Risk level", "Deadline context"].map((label) => <th key={label} className="whitespace-nowrap p-3 font-semibold">{label}</th>)}</tr></thead>
        <tbody>{shown.map((project) => <tr key={project.id} className="border-t border-ink-200 hover:bg-ink-100">
          <td className="p-3"><Link href={"/projects/" + project.id} className="font-medium text-gov-800 hover:underline">{project.name}</Link></td>
          <td className="p-3">{project.state}</td><td className="p-3">{project.sector}</td>
          <td className="p-3">{project.physical == null ? "Unavailable" : project.physical + "%"}</td>
          <td className="p-3 font-semibold">{Number.isFinite(project.risk) ? project.risk.toFixed(1) + "%" : "Unavailable"}</td>
          <td className="p-3 font-semibold">{Number.isFinite(project.risk6m) ? project.risk6m.toFixed(1) + "%" : "Unavailable"}</td>
          <td className="p-3 font-semibold">{Number.isFinite(project.risk12m) ? project.risk12m.toFixed(1) + "%" : "Unavailable"}</td>
          <td className="p-3"><RiskBadge band={project.band} /></td><td className="p-3">{project.warningType || "Unavailable"}</td>
        </tr>)}</tbody>
      </table></div>}
    {rows.length > PAGE && <div className="mt-4 flex items-center justify-between text-sm"><span className="text-ink-500">Showing {page * PAGE + 1}–{Math.min(rows.length, (page + 1) * PAGE)} of {rows.length}</span><span className="flex gap-2"><button className="btn-ghost" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button><button className="btn-ghost" disabled={(page + 1) * PAGE >= rows.length} onClick={() => setPage(page + 1)}>Next</button></span></div>}
  </div>;
}
