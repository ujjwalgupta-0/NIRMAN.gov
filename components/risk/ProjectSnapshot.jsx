import { Metric } from "@/components/ui";
import { crore } from "@/lib/risk";

export default function ProjectSnapshot({ p }) {
  const percent = (value) => value == null ? "Unavailable" : value + "%";
  const months = (value) => value == null ? "Unavailable" : value + " months";
  const rows = [
    ["Physical progress", percent(p.physical)],
    ["Expected physical progress", percent(p.expectedPhysical)],
    ["Financial progress", percent(p.financial)],
    ["Schedule deviation", percent(p.scheduleDeviation)],
    ["Planned duration", months(p.plannedDuration)],
    ["Elapsed duration", months(p.elapsedDuration)],
    ["Original sanctioned cost", p.originalCost == null ? "Unavailable" : crore(p.originalCost)],
    p.currentCost != null ? ["Current cost exposure", crore(p.currentCost)] : null,
    p.reliability == null ? null : ["Data reliability", p.reliability + "%"],
    ["Early warning", p.earlyWarningActive == null ? "Unavailable" : p.earlyWarningActive ? "Active" : "Not active"]
  ].filter(Boolean);
  const modelFields = [
    ["overall_risk_score", p.overall_risk_score],
    ["risk_escalation_rate", p.risk_escalation_rate],
    ["risk_trend_status", p.risk_trend_status],
    ["alert_severity_level", p.alert_severity_level],
    ["data_integrity_score_pct", p.data_integrity_score_pct],
    ["intervention_priority_rank", p.intervention_priority_rank],
    ["intervention_priority_score", p.intervention_priority_score],
    ["festival_labor_shortage_pct", p.festival_labor_shortage_pct],
    ["active_projects_within_30km", p.active_projects_within_30km],
    ["local_supply_competition_score", p.local_supply_competition_score],
    ["private_funding_share_pct", p.private_funding_share_pct],
    ["investor_backing_score", p.investor_backing_score],
    ["available_surplus_machinery_units", p.available_surplus_machinery_units ?? p.available_surplus_machine_units],
    ["is_equipment_transfer_eligible", p.is_equipment_transfer_eligible],
    ["weather_delay_factor", p.weather_delay_factor],
    ["missed_milestones_count", p.missed_milestones_count],
    ["formal_revisions_count", p.formal_revisions_count],
    ["schedule_delay_gap_pct", p.schedule_delay_gap_pct],
    ["cost_physical_variance_gap_pct", p.cost_physical_variance_gap_pct]
  ].filter(([, value]) => value != null);

  return <>
    <dl className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10">
      {rows.map(([l, v]) => <Metric key={l} label={l} value={v} />)}
    </dl>
    {modelFields.length > 0 && <details className="mt-6 border border-ink-200">
      <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">Dataset fields supplied with this project</summary>
      <dl className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 px-4 pb-4">
        {modelFields.map(([field, value]) => <div key={field} className="border-t border-ink-200 py-2.5 min-w-0">
          <dt className="font-mono text-xs text-ink-500 break-all">{field}</dt>
          <dd className="text-sm font-medium mt-1">{typeof value === "number" ? value.toLocaleString("en-IN") : String(value)}</dd>
        </div>)}
      </dl>
    </details>}
  </>;
}
