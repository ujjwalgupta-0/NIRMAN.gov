/**
 * Prototype-only synthetic project snapshots; these are not official outcome data.
 * Dated history, model attributions, and verified reliability stay unavailable
 * until the API supplies them. Replace this fallback once all routes are live.
 */
import { band } from "./risk";

const STATES = ["Punjab", "Maharashtra", "Odisha", "Assam", "Tamil Nadu", "Gujarat", "Bihar", "Karnataka", "Uttarakhand", "Rajasthan"];
const SECTORS = ["Roads", "Railways", "Power", "Water Resources", "Urban Transport", "Ports", "Health", "Petroleum"];
const AGENCIES = ["NHAI", "RVNL", "NTPC", "CWC", "DMRC", "SPA", "CPWD", "IOCL"];
const TITLES = [
  "Northern Highway Expansion", "Coastal Corridor Doubling", "Thermal Unit Augmentation", "Canal Modernisation Phase II",
  "Metro Line Extension", "Deep Water Berth Development", "District Hospital Upgrade", "Pipeline Reinforcement",
  "Ring Road Bypass", "Freight Terminal Redevelopment", "Grid Substation Package", "Barrage Rehabilitation",
  "Riverfront Embankment Works", "Rail Overbridge Cluster", "Transmission Line Package", "Water Supply Augmentation"
];
const UNITS = ["Phase I", "Phase II", "Package 2", "Package 4", "Reach 3", "Section B", "Contract 1C", "Stage III"];

/** Deterministic seeded RNG (xmur3 hash + mulberry32). A weak hash here makes
 *  neighbouring ids like P0001/P0002 draw near-identical numbers, which is
 *  what previously pushed almost every project into the same risk band. */
function rng(seed) {
  let h = 1779033703 ^ String(seed).length;
  for (const c of String(seed)) {
    h = Math.imul(h ^ c.charCodeAt(0), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = (Math.imul(h ^ (h >>> 16), 2246822519) >>> 0);
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = (r, a) => a[Math.floor(r() * a.length)];
const num = (r, lo, hi, d = 0) => +(lo + r() * (hi - lo)).toFixed(d);

export const ASSESSED_AT = "2026-09-18T14:32:00+05:30";

export function project(id) {
  const r = rng(id);
  const risk = num(r, 12, 92, 0);
  // There are no dated observations in the bundled prototype register.
  const state = pick(r, STATES);
  const sector = pick(r, SECTORS);
  const physical = num(r, 8, 95, 0);
  const expectedPhysical = Math.min(99, physical + num(r, -4, 26, 0));
  const activeProjectsWithin30km = Math.floor(r() * 5);
  const surplusMachinery = Math.floor(r() * 13);
  const privateFundingSharePct = num(r, 0, 0.65, 2);
  const approvedDuration = num(r, 24, 72, 0);
  const elapsedDuration = Math.min(approvedDuration, num(r, 10, 60, 0));
  const financial = Math.min(99, physical + num(r, -6, 14, 0));
  const scheduleDelayGapPct = +((expectedPhysical - physical) / 100).toFixed(3);
  const festivalLaborShortagePct = num(r, 0, state === "Bihar" || state === "Uttar Pradesh" ? 0.3 : 0.18, 3);
  const localSupplyCompetitionScore = +Math.min(1, activeProjectsWithin30km * 0.14 + r() * 0.35).toFixed(2);
  const riskEscalationRate = null;
  const riskTrendStatus = "UNAVAILABLE";
  const alertSeverityLevel = risk > 70 || (risk > 60 && riskEscalationRate > 0) ? "RED" : risk >= 35 ? "AMBER" : "GREEN";
  const sanctionedBudgetCr = num(r, 240, 9800, 0);
  const budgetDisbursedPct = +(financial / 100).toFixed(3);
  const costPhysicalVarianceGapPct = +(budgetDisbursedPct - physical / 100).toFixed(3);
  // Exact intervention rank normalization belongs to the fitted model service.
  const interventionPriorityRank = null;
  const interventionPriorityScore = null;
  return {
    id,
    name: pick(r, TITLES) + " — " + pick(r, UNITS),
    project_id: Number(String(id).replace(/\D/g, "")) || id,
    state,
    state_name: state,
    city_district: null,
    sector,
    sector_name: sector,
    agency: pick(r, AGENCIES),
    executing_agency: pick(r, AGENCIES),
    assessedAt: ASSESSED_AT,
    risk,
    overall_risk_score: risk / 100,
    band: band(risk),
    previousRisk: null,
    change30: null,
    change90: null,
    physical,
    actual_physical_progress_pct: physical / 100,
    expectedPhysical,
    target_physical_progress_pct: expectedPhysical / 100,
    financial,
    scheduleDeviation: num(r, -5, 42, 0),
    schedule_delay_gap_pct: scheduleDelayGapPct,
    approved_duration_months: approvedDuration,
    elapsed_duration_months: elapsedDuration,
    plannedDuration: approvedDuration,
    elapsedDuration,
    originalCost: sanctionedBudgetCr,
    sanctioned_budget_cr: sanctionedBudgetCr,
    currentCost: null,
    budget_disbursed_pct: budgetDisbursedPct,
    cost_physical_variance_gap_pct: costPhysicalVarianceGapPct,
    reliability: null,
    data_integrity_score_pct: null,
    festival_labor_shortage_pct: festivalLaborShortagePct,
    active_projects_within_30km: activeProjectsWithin30km,
    local_supply_competition_score: localSupplyCompetitionScore,
    private_funding_share_pct: privateFundingSharePct,
    investor_backing_score: +(privateFundingSharePct * 100).toFixed(1),
    available_surplus_machine_units: surplusMachinery,
    available_surplus_machinery_units: surplusMachinery,
    is_equipment_transfer_eligible: physical > 85 && activeProjectsWithin30km >= 2 ? 1 : 0,
    risk_escalation_rate: riskEscalationRate,
    risk_trend_status: riskTrendStatus,
    alert_severity_level: alertSeverityLevel,
    intervention_priority_rank: interventionPriorityRank,
    intervention_priority_score: interventionPriorityScore,
    weather_delay_factor: num(r, 0.1, 0.85, 2),
    missed_milestones_count: Math.floor(r() * 8),
    formal_revisions_count: Math.floor(r() * 4),
    earlyWarningActive: risk >= 70
  };
}

export const projects = () =>
  Array.from({ length: 34 }, (_, i) => {
    const p = project("P" + String(i + 1).padStart(4, "0"));
    p.currentCost = Math.round(p.originalCost * (1 + p.scheduleDeviation / 260));
    p.budget_disbursed_pct = +(p.financial / 100).toFixed(3);
    p.cost_physical_variance_gap_pct = +(p.budget_disbursed_pct - p.actual_physical_progress_pct).toFixed(3);
    p.missed_milestones_count = Math.max(0, Math.round(p.scheduleDeviation / 8));
    p.formal_revisions_count = Math.max(0, Math.round(p.scheduleDeviation / 15));
    return p;
  });

export function history(id) {
  // No historical observations are bundled in this prototype.
  return [];
}

export function explanations(id) {
  // Driver contributions require the fitted model's explanation endpoint.
  return { increasing: [], decreasing: [], change: null };
}

export function earlyWarning(id) {
  const p = project(id);
  return {
    active: p.earlyWarningActive,
    threshold: 75,
    currentRisk: p.risk,
    leadMonths: null,
    note: p.earlyWarningActive
      ? "Demo warning state based on the synthetic risk value. Verified warning lead time is unavailable."
      : "No demo warning is active. The local register does not include a verified warning history."
  };
}

export function interventions(id) {
  return [];
}

export function portfolio() {
  const all = projects();
  const count = (b) => all.filter((p) => p.band === b).length;
  return {
    total: all.length,
    critical: count("RED"),
    watch: count("AMBER"),
    stable: count("GREEN"),
    emerging: null,
    warnings: all.filter((p) => p.earlyWarningActive).length,
    exposure: all.filter((p) => p.band === "RED").reduce((s, p) => s + p.currentCost, 0),
    avgLead: null,
    sectors: [...new Set(all.map((p) => p.sector))].map((s) => {
      const g = all.filter((p) => p.sector === s);
      return { sector: s, risk: +(g.reduce((a, p) => a + p.risk, 0) / g.length).toFixed(1), count: g.length };
    }),
    trend: []
  };
}

export const dataQuality = () => ({ overall: null, fields: [] });
