"use client";
import { useMemo } from "react";
import Icon from "@/components/Icon";
import { getProjects } from "@/lib/api";
import useData from "@/lib/useData";
import { Empty, ErrorState, Loading, Section } from "@/components/ui";

const FIELDS = [
  "project_id", "sector_name", "state_name", "executing_agency", "actual_progress_pct", "planned_progress_pct",
  "months_to_planned_completion", "spend_pct_of_budget", "delay_6m", "delay_12m", "cost_overrun_6m",
  "cost_overrun_12m", "max_risk", "risk_band", "warning_type"
];
const ALIASES = { sector_name: "sector", state_name: "state", executing_agency: "agency" };
const RISK_FIELDS = { delay_6m: "delayRisk6m", delay_12m: "delayRisk12m", cost_overrun_6m: "costRisk6m", cost_overrun_12m: "costRisk12m" };
const FIELD_HELP = {
  project_id: "Unique project record identifier.",
  sector_name: "Infrastructure sector for the project.",
  state_name: "State or union territory where the project is recorded.",
  executing_agency: "Agency listed as responsible for delivery.",
  actual_progress_pct: "Reported physical progress to date.",
  planned_progress_pct: "Planned physical progress at the snapshot date.",
  months_to_planned_completion: "Months remaining to planned completion; negative values are past the planned date.",
  spend_pct_of_budget: "Reported spend as a percentage of the planned budget.",
  delay_6m: "Schedule delay risk index for the next 6 months, on a 0-100 scale.",
  delay_12m: "Schedule delay risk index for the next 12 months, on a 0-100 scale.",
  cost_overrun_6m: "Cost overrun risk index for the next 6 months, on a 0-100 scale.",
  cost_overrun_12m: "Cost overrun risk index for the next 12 months, on a 0-100 scale.",
  max_risk: "Highest of the four schedule and cost risk forecasts, on a 0-100 scale.",
  risk_band: "Risk category associated with the highest forecast.",
  warning_type: "Deadline or snapshot warning context supplied with the record."
};
const exportValue = (project, field) => {
  if (RISK_FIELDS[field]) return project[RISK_FIELDS[field]];
  if (field === "max_risk") {
    const values = [project.delayRisk6m, project.delayRisk12m, project.costRisk6m, project.costRisk12m].filter(Number.isFinite);
    return values.length ? Math.max(...values) : null;
  }
  return project[field] ?? project[ALIASES[field]];
};
const csvCell = (value) => {
  let cell = value == null ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(cell)) cell = "'" + cell;
  return '"' + cell.replaceAll('"', '""') + '"';
};

export default function ReportsPage() {
  const { data, error, loading, retry } = useData(getProjects);
  const csv = useMemo(() => {
    if (!data) return "";
    return [FIELDS.join(","), ...data.map((project) => FIELDS.map((field) => csvCell(exportValue(project, field))).join(","))].join("\r\n");
  }, [data]);
  if (loading) return <Loading rows={6} />;
  if (error) return <ErrorState message={error} retry={retry} />;
  if (!data.length) return <><h1 className="text-3xl font-bold">Reports &amp; exports</h1><Empty message="Add project data before exporting a report." /></>;
  const download = () => {
    const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "nirman-project-register.csv";
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const coverage = FIELDS.map((field) => ({
    field,
    count: data.filter((project) => exportValue(project, field) != null && exportValue(project, field) !== "").length
  }));
  return <>
    <header className="mb-7 rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-sky-50 p-5 shadow-sm sm:p-7">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-gov-700">Data workspace</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Reports &amp; exports</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">Download the project register with its source context and four risk forecasts.</p>
      <div className="mt-5 flex flex-wrap gap-2" data-print-hide="true">
        <button className="btn-primary rounded-lg shadow-sm" onClick={download}><Icon name="download" size={16} />Download CSV</button>
        <button className="btn-ghost rounded-lg bg-white" onClick={() => window.print()}><Icon name="printer" size={16} />Print field guide</button>
      </div>
      <div className="mt-5 grid max-w-2xl grid-cols-3 gap-2 sm:gap-3">
        {[ ["Project records", data.length], ["Export fields", FIELDS.length], ["Risk forecasts", 4] ].map(([label, value]) => <div key={label} className="rounded-xl border border-white/80 bg-white/75 px-3 py-2.5 shadow-sm"><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 text-xl font-black tabular-nums text-slate-900">{value}</p></div>)}
      </div>
    </header>
    <Section title="Project risk index export" hint={data.length + " projects · " + FIELDS.length + " fields"}>
      <div className="mb-5 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white text-gov-800 shadow-sm"><Icon name="download" size={18} /></span>
        <div><h2 className="text-sm font-bold text-slate-900">CSV data export</h2><p className="mt-0.5 text-xs text-slate-600">Missing source values remain blank. Risk forecasts are exported on a 0-100 scale.</p></div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm"><table className="w-full min-w-[760px] text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr>{["Field", "Coverage", "Description"].map((label) => <th className="p-3" key={label}>{label}</th>)}</tr></thead>
        <tbody>{coverage.map(({ field, count }) => <tr className="border-t border-slate-100 transition-colors hover:bg-slate-50/80" key={field}><td className="whitespace-nowrap p-3 font-mono text-xs font-semibold text-slate-800">{field}</td><td className="p-3"><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold tabular-nums text-slate-700">{count} / {data.length}</span></td><td className="max-w-xl p-3 text-xs leading-relaxed text-slate-600">{FIELD_HELP[field]}</td></tr>)} </tbody>
      </table></div>
    </Section>
  </>;
}
