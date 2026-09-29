import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { calculateRiskIndices } from "../lib/risk-engine.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "nirman_synthetic_v1");
const output = path.join(root, "public", "data");

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  const input = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    if (char === '"' && quoted && input[i + 1] === '"') { cell += '"'; i += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { row.push(cell); cell = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && input[i + 1] === "\n") i += 1;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += char;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [headers, ...records] = rows;
  return records.filter((cells) => cells.some(Boolean)).map((cells) => Object.fromEntries(headers.map((key, index) => [key, cells[index] ?? ""])));
}

const readCsv = (name) => parseCsv(fs.readFileSync(path.join(source, name), "utf8"));
const number = (value) => value != null && value !== "" && Number.isFinite(Number(value)) ? Number(value) : null;
const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));
// Keep the illustrative risk index informative across the portfolio without
// saturating the dial at 0% or 100%.
const fmt = (value) => Number.isFinite(value) ? String(Number(value.toFixed(6))) : "";
const csv = (value) => {
  const string = value == null ? "" : String(value);
  return /[",\r\n]/.test(string) ? `"${string.replaceAll('"', '""')}"` : string;
};
const percentile = (value, max) => value == null ? 0 : clamp(value / max * 100);

const features = new Map(readCsv("nirman_project_features.csv").map((row) => [row.project_id, row]));
const contractorNames = new Map(readCsv("nirman_contractors.csv").map((row) => [row.contractor_id, row.contractor_name]));
const qualityByProject = new Map(readCsv("nirman_quality_inputs.csv").map((row) => [row.project_id, row]));
const panels = readCsv("nirman_project_monthly_snapshots_with_contractor_features.csv");
const latestByProject = new Map();
for (const row of panels) {
  const previous = latestByProject.get(row.project_id);
  if (!previous || row.snapshot_date > previous.snapshot_date) latestByProject.set(row.project_id, row);
}

const records = [...latestByProject.values()].map((row) => {
  const project = features.get(row.project_id) ?? {};
  const quality = qualityByProject.get(row.project_id) ?? {};
  const n = (key) => number(row[key]);
  const actual = n("actual_progress_pct");
  const planned = n("planned_progress_pct");
  const scheduleDelay = n("schedule_delay_months");
  const monthsPast = n("months_past_planned_completion");
  const milestoneOnTime = n("milestone_on_time_rate");
  const qualityScore = n("quality_score") ?? number(quality.quality_score);
  const contractorDelay = n("contractor_historical_delay_rate");
  const contractorOverrun = n("contractor_historical_cost_overrun_rate");
  const contractorWorkload = n("contractor_current_workload");
  const plannedCost = number(project.planned_cost_cr);
  const spendPct = plannedCost > 0 && n("actual_cost_to_date_cr") != null ? n("actual_cost_to_date_cr") / plannedCost * 100 : null;
  const currentOverrun = n("cost_overrun_to_date_pct");
  const budgetExceeded = n("budget_exceeded_cr");
  const milestoneRate = milestoneOnTime ?? n("milestone_success_rate");
  const snapshotDate = row.snapshot_date;
  const targetDate = project.planned_completion_date;
  const monthsToCompletion = targetDate ? (new Date(`${targetDate}T00:00:00Z`).getUTCFullYear() - new Date(`${snapshotDate}T00:00:00Z`).getUTCFullYear()) * 12 + new Date(`${targetDate}T00:00:00Z`).getUTCMonth() - new Date(`${snapshotDate}T00:00:00Z`).getUTCMonth() : null;
  const scores = calculateRiskIndices({
    actualProgress: actual, plannedProgress: planned, scheduleDelay, monthsPastDeadline: monthsPast,
    monthsToCompletion, spendPct, remainingBudget: n("remaining_budget_cr"),
    budgetExceeded, costOverrunToDate: currentOverrun, milestoneCompletion: n("milestone_completion_pct"),
    milestoneOnTime: milestoneRate, qualityScore, materialPass: number(quality.material_test_pass_pct),
    inspectionScore: number(quality.site_inspection_score), reworkPct: number(quality.rework_pct),
    contractorWorkload, contractorHistory: n("contractor_prior_completed_projects"),
    contractorDelayRate: contractorDelay, contractorDelayMonths: n("contractor_historical_avg_delay_months"),
    contractorCostOverrunRate: contractorOverrun, workingDayLoss: n("calendar_working_day_loss_pct"),
    festivalCount: n("gazetted_festival_count"), monsoonDaysThisMonth: n("monsoon_days_in_month"),
    rainfallPct: n("rainfall_pct_of_normal_prev_month")
  });
  const { delay6, delay12, cost6, cost12 } = scores;
  const status = row.project_status || "ongoing";
  const warning = status === "completed" ? "historical snapshot · completed" : (monthsPast ?? 0) > 0 ? "already overdue" : monthsToCompletion != null && monthsToCompletion <= 6 ? "deadline within 6 months" : "active project";
  const high = Math.max(delay6, delay12, cost6, cost12);
  const meanRisk = (delay6 + delay12 + cost6 + cost12) / 4;
  const band = meanRisk > 60 ? "Severe" : meanRisk > 30 ? "Elevated" : "Stable";
  const name = [project.sector_name, project.district || project.city, `Project ${row.project_id}`].filter(Boolean).join(" · ");
  const scenario = {
    project_id: row.project_id,
    snapshot_date: snapshotDate,
    projectStatus: status,
    climateRegion: project.climate_region,
    unionTerritory: String(project.is_union_territory).toLowerCase() === "true",
    monthsElapsed: n("months_elapsed"), monthsToCompletion, actualProgress: actual, plannedProgress: planned,
    scheduleDelay, monthsPastDeadline: monthsPast,
    spendPct, remainingBudget: n("remaining_budget_cr"), budgetExceeded,
    costOverrunToDate: currentOverrun, plannedCost, plannedMonths: number(project.planned_months),
    milestoneCompletion: n("milestone_completion_pct"), milestoneOnTime: milestoneRate,
    qualityScore, materialPass: number(quality.material_test_pass_pct), inspectionScore: number(quality.site_inspection_score), reworkPct: number(quality.rework_pct),
    contractorId: row.contractor_id, contractorName: contractorNames.get(row.contractor_id) ?? "Unavailable",
    contractorWorkload, contractorHistory: n("contractor_prior_completed_projects"), contractorDelayRate: contractorDelay,
    contractorDelayMonths: n("contractor_historical_avg_delay_months"), contractorCostOverrunRate: contractorOverrun
  };
  return {
    risk: meanRisk,
    csv: [row.project_id, name, project.sector_name, project.executing_agency, project.state_name, project.district, snapshotDate,
      fmt(planned), fmt(actual), fmt(monthsToCompletion), fmt(spendPct), fmt(cost6 / 100), fmt(cost12 / 100), fmt(delay6 / 100), fmt(delay12 / 100), fmt(high / 100), band, warning],
    scenario
  };
});

const headers = ["project_id", "project_name", "sector_name", "executing_agency", "state_name", "district", "snapshot_date", "planned_progress_pct", "actual_progress_pct", "months_to_planned_completion", "spend_pct_of_budget", "cost_overrun_6m", "cost_overrun_12m", "delay_6m", "delay_12m", "max_risk", "risk_band", "warning_type"];
fs.writeFileSync(path.join(output, "nirman_v7_project_risk.csv"), [headers.join(","), ...records.map(({ csv: cells }) => cells.map(csv).join(","))].join("\n") + "\n");
fs.writeFileSync(path.join(output, "nirman_v7_scenario_inputs.json"), JSON.stringify(records.map(({ scenario }) => scenario), null, 2) + "\n");
const indexes = records.map(({ risk }) => risk);
console.log(`Wrote ${records.length} unique synthetic projects. Headline risk index range: ${Math.min(...indexes).toFixed(1)}–${Math.max(...indexes).toFixed(1)}.`);
